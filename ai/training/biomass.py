"""CSIRO image-only biomass baseline. Audit, train, predict and export commands."""
import argparse
import collections
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[2]
TARGETS = ['Dry_Green_g', 'Dry_Dead_g', 'Dry_Clover_g', 'GDM_g', 'Dry_Total_g']
LIMITS = ['Experimental pasture quadrat biomass in grams, not feed classification or nutrients.',
          'Only top-down pasture images matching the source acquisition scale are in scope.',
          'State/date groups are proxies; no farm identifiers or independently validated uncertainty.',
          'No safety clearance, toxin estimate, moisture percentage, or kg/ha conversion.']


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, allow_nan=False), encoding='utf-8')


def inside(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f'Image escapes dataset: {relative}')
    return path


def audit(data, out):
    files = [p for p in data.rglob('*') if p.is_file()]
    df = pd.read_csv(data / 'train.csv')
    required = {'image_path', 'Sampling_Date', 'State', 'target_name', 'target'}
    if not required.issubset(df.columns) or df[list(required)].isna().any().any():
        raise ValueError('Missing required metadata or labels')
    if df.duplicated(['image_path', 'target_name']).any():
        raise ValueError('Duplicate image/target records')
    if set(df.target_name) != set(TARGETS):
        raise ValueError('Unexpected targets')
    wide = df.pivot(index='image_path', columns='target_name', values='target')[TARGETS]
    if not np.isfinite(wide.to_numpy()).all() or (wide < 0).any().any():
        raise ValueError('Incomplete, negative or nonfinite targets')
    meta_cols = ['Sampling_Date', 'State', 'Species']
    if (df.groupby('image_path')[meta_cols].nunique() > 1).any().any():
        raise ValueError('Conflicting image metadata')
    wide = wide.join(df.drop_duplicates('image_path').set_index('image_path')[meta_cols])
    hashes, errors, sizes = {}, [], collections.Counter()
    for rel in sorted(set(wide.index) | set(pd.read_csv(data / 'test.csv').image_path)):
        try:
            path = inside(data, rel)
            with Image.open(path) as im:
                im.load()
                sizes[str(im.size)] += 1
            hashes[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
        except Exception as exc:
            errors.append({'image': rel, 'error': str(exc)})
    if errors:
        write_json(out / 'invalid_images.json', errors)
        raise ValueError('Unreadable/missing images; see invalid_images.json')
    # Fail rather than allow identical photos to cross independently assigned groups.
    duplicates = [h for h, count in collections.Counter(hashes.values()).items() if count > 1]
    if duplicates:
        raise ValueError('Exact duplicate images found; resolve grouping before splitting')
    wide['sha256'] = [hashes[p] for p in wide.index]
    wide['group'] = wide.State + '|' + pd.to_datetime(wide.Sampling_Date).dt.strftime('%Y-%m-%d')
    groups = wide.group.to_numpy()
    train, remaining = next(GroupShuffleSplit(n_splits=1, test_size=.3, random_state=42).split(wide, groups=groups))
    val, test = next(GroupShuffleSplit(n_splits=1, test_size=.5, random_state=43).split(remaining, groups=groups[remaining]))
    wide['split'] = ''
    for name, ids in {'train': train, 'validation': remaining[val], 'test': remaining[test]}.items():
        wide.iloc[ids, wide.columns.get_loc('split')] = name
    out.mkdir(parents=True, exist_ok=True)
    wide.reset_index().to_csv(out / 'dataset_index.csv', index=False)
    summary = {'dataset': 'CSIRO Image2Biomass Kaggle local release', 'files': len(files),
               'bytes': sum(p.stat().st_size for p in files),
               'extensions': dict(collections.Counter(p.suffix for p in files)),
               'image_sizes': dict(sizes), 'label_rows': len(df), 'labelled_images': len(wide),
               'unlabelled_images': pd.read_csv(data / 'test.csv').image_path.nunique(),
               'targets': TARGETS, 'classes': [], 'task': 'multi-output biomass regression',
               'splits': wide.split.value_counts().to_dict(), 'groups': len(set(groups)),
               'duplicate_images': len(duplicates), 'unreadable_images': len(errors),
               'target_ranges': {k: {'min': float(wide[k].min()), 'max': float(wide[k].max())} for k in TARGETS},
               'limitations': LIMITS}
    write_json(out / 'audit.json', summary)
    print(json.dumps(summary, indent=2))
    return wide.reset_index()


def preprocess(path):
    """Two square views, deterministic nearest sampling, ImageNet normalization.

    Explicit pixel-centre mapping is shared with browser code; no random test transforms.
    """
    with Image.open(path) as im:
        rgb = np.asarray(im.convert('RGB'))
    h, w = rgb.shape[:2]
    # Split full width into left/right views; preserve all the source image.
    views = []
    for left, right in [(0, w // 2), (w // 2, w)]:
        xs = np.minimum(((np.arange(224) + .5) * (right-left) / 224).astype(int) + left, w-1)
        ys = np.minimum(((np.arange(224) + .5) * h / 224).astype(int), h-1)
        views.append(rgb[ys[:, None], xs[None, :]])
    pixels = np.concatenate(views, axis=1).astype(np.float32) / 255
    return ((pixels - np.array([.485, .456, .406], dtype=np.float32)) /
            np.array([.229, .224, .225], dtype=np.float32)).transpose(2, 0, 1).copy()


def backbone():
    import torch
    from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
    torch.set_num_threads(4)
    model = mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.DEFAULT)
    model.classifier = torch.nn.Identity()
    return model.eval()


def encode(model, x):
    return (model(x[:, :, :, :224]) + model(x[:, :, :, 224:])) / 2


def components(raw):
    base = np.maximum(raw, 0)
    return np.column_stack([base, base[:, 0] + base[:, 2], base.sum(axis=1)])


def metrics(y, pred):
    return {k: {'mae_g': float(mean_absolute_error(y[:, i], pred[:, i])),
                'rmse_g': float(np.sqrt(mean_squared_error(y[:, i], pred[:, i]))),
                'r2': float(r2_score(y[:, i], pred[:, i])) if np.var(y[:, i]) > 0 else None}
            for i, k in enumerate(TARGETS)}


def train(data, prepared, output):
    import torch
    rows = pd.read_csv(prepared / 'dataset_index.csv')
    if rows.groupby('group').split.nunique().max() != 1 or rows.sha256.duplicated().any():
        raise ValueError('Leaking groups or duplicate images')
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = backbone().to(device)
    features = []
    with torch.inference_mode():
        for start in range(0, len(rows), 16):
            batch = rows.iloc[start:start+16]
            for row in batch.itertuples():
                if hashlib.sha256(inside(data, row.image_path).read_bytes()).hexdigest() != row.sha256:
                    raise ValueError('Image changed since audit')
            x = torch.from_numpy(np.stack([preprocess(inside(data, p)) for p in batch.image_path])).to(device)
            features.append(encode(model, x).cpu().numpy())
            print(f'Features {min(start+16,len(rows))}/{len(rows)} ({device})', flush=True)
    x = np.concatenate(features)
    y = rows[TARGETS].to_numpy()
    tr, va, te = [rows.split.to_numpy() == s for s in ['train', 'validation', 'test']]
    scaler = StandardScaler().fit(x[tr])
    z = scaler.transform(x)
    candidates = []
    best = None
    for alpha in [1., 10., 100., 1000.]:
        reg = Ridge(alpha=alpha).fit(z[tr], y[tr, :3])
        pred = components(reg.predict(z[va]))
        score = float(np.mean((pred - y[va]) ** 2))
        candidates.append({'alpha': alpha, 'validation_mse_g2': score})
        if best is None or score < best[0]:
            best = (score, reg)
    reg = best[1]
    pred = components(reg.predict(z[te]))
    baseline = np.repeat(y[tr].mean(axis=0)[None, :], te.sum(), axis=0)
    result = {'task': 'biomass_regression', 'status': 'experimental', 'device': device,
              'epochs': 0, 'training_method': 'frozen ImageNet features + closed-form ridge regression',
              'alpha': reg.alpha, 'validation_candidates': candidates,
              'test_count': int(te.sum()), 'per_target': metrics(y[te], pred),
              'training_mean_baseline': metrics(y[te], baseline), 'limitations': LIMITS}
    output.mkdir(parents=True, exist_ok=True)
    write_json(output / 'model_metrics.json', result)
    # Fold scaler into the coefficients for small, dependency-free regression export.
    coefficient = reg.coef_ / scaler.scale_[None, :]
    intercept = reg.intercept_ - coefficient @ scaler.mean_
    torch.save({'backbone': model.cpu().state_dict(), 'coefficient': torch.tensor(coefficient, dtype=torch.float32),
                'intercept': torch.tensor(intercept, dtype=torch.float32)}, output / 'biomass.pt')
    write_json(output / 'model_metadata.json', {'task': 'biomass_regression', 'status': 'experimental',
        'training_date': datetime.now(timezone.utc).isoformat(),
        'dataset': 'CSIRO Image2Biomass local Kaggle release: 357 labelled images',
        'architecture': 'MobileNetV3-Small frozen + ridge', 'targets': TARGETS, 'unit': 'g',
        'input_shape': [1, 3, 224, 448], 'preprocessing': 'two horizontal halves; pixel-centre nearest to 224x224 each; RGB ImageNet normalization',
        'classes': [], 'confidence_threshold': None, 'metrics': result,
        'model_bytes': (output / 'biomass.pt').stat().st_size, 'limitations': LIMITS})
    pd.DataFrame({'image_path': rows.loc[te, 'image_path'], **{f'pred_{k}': pred[:, i] for i, k in enumerate(TARGETS)}}).to_csv(output / 'test_predictions.csv', index=False)
    print(json.dumps(result, indent=2))


def load_model(folder):
    import torch
    from torchvision.models import mobilenet_v3_small
    class Biomass(torch.nn.Module):
        def __init__(self, saved):
            super().__init__()
            self.encoder = mobilenet_v3_small(weights=None)
            self.encoder.classifier = torch.nn.Identity()
            self.encoder.load_state_dict(saved['backbone'])
            self.register_buffer('coefficient', saved['coefficient'])
            self.register_buffer('intercept', saved['intercept'])
        def forward(self, x):
            base = torch.clamp(encode(self.encoder, x) @ self.coefficient.T + self.intercept, min=0)
            return torch.cat([base, base[:, 0:1] + base[:, 2:3], base.sum(dim=1, keepdim=True)], dim=1)
    torch.set_num_threads(4)
    return Biomass(torch.load(folder / 'biomass.pt', map_location='cpu', weights_only=True)).eval()


def predict(folder, image, output):
    import torch
    with torch.inference_mode():
        values = load_model(folder)(torch.from_numpy(preprocess(image)[None])).numpy()[0]
    result = {'task': 'biomass_regression', 'status': 'experimental', 'unit': 'g',
              'predictions': dict(zip(TARGETS, map(float, values))), 'confidence': None, 'limitations': LIMITS}
    write_json(output, result)
    print(json.dumps(result, indent=2))


def export(folder, image, destination):
    import torch
    import onnxruntime as ort
    model = load_model(folder)
    x = torch.from_numpy(preprocess(image)[None])
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / 'biomass.onnx'
    torch.onnx.export(model, x, str(path), input_names=['image'], output_names=['biomass'], opset_version=17, dynamo=False)
    with torch.inference_mode():
        expected = model(x).numpy()
    actual = ort.InferenceSession(str(path), providers=['CPUExecutionProvider']).run(None, {'image': x.numpy()})[0]
    np.testing.assert_allclose(actual, expected, rtol=1e-3, atol=1e-3)
    import shutil
    destination.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination / 'biomass.onnx')
    meta = json.loads((folder / 'model_metadata.json').read_text(encoding='utf-8'))
    meta.setdefault('training_date', datetime.fromtimestamp((folder / 'biomass.pt').stat().st_mtime, timezone.utc).isoformat())
    meta.setdefault('dataset', 'CSIRO Image2Biomass local Kaggle release: 357 labelled images')
    meta['onnx_parity_max_error_g'] = float(np.abs(actual-expected).max())
    write_json(destination / 'model_metadata.json', meta)
    # Lossless copy gives browser tests the same decoded RGB pixels as Python.
    with Image.open(image) as fixture:
        fixture.convert('RGB').save(folder / 'parity.png')
    write_json(folder / 'parity.json', {'predictions': dict(zip(TARGETS, map(float, expected[0])))})
    print(f'Exported {path.stat().st_size} bytes; parity PASS')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['audit', 'train', 'predict', 'export'])
    parser.add_argument('--data', type=Path, default=ROOT / 'ai/datasets/csiro-biomass')
    parser.add_argument('--prepared', type=Path, default=ROOT / 'ai/processed/csiro-biomass')
    parser.add_argument('--output', type=Path, default=ROOT / 'ai/results/biomass')
    parser.add_argument('--image', type=Path)
    parser.add_argument('--destination', type=Path, default=ROOT / 'frontend/public/models/biomass')
    args = parser.parse_args()
    if args.command in ['predict', 'export'] and not args.image:
        parser.error('--image is required')
    if args.command == 'audit': audit(args.data, args.prepared)
    elif args.command == 'train': train(args.data, args.prepared, args.output)
    elif args.command == 'predict': predict(args.output, args.image, args.output / 'prediction.json')
    else: export(args.output, args.image, args.destination)
