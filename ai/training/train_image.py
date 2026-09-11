"""Train an experimental MobileNetV3 feature-transfer baseline, never auto-deploy."""
import argparse
import json
from pathlib import Path
import random

import numpy as np
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix
import torch
from torch import nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--epochs', type=int, default=50)
    args = parser.parse_args()
    if args.epochs < 1:
        parser.error('epochs must be positive')
    torch.manual_seed(42)
    np.random.seed(42)
    random.seed(42)
    torch.set_num_threads(4)
    manifest = json.loads(args.manifest.read_text(encoding='utf-8'))
    rows, classes = manifest['rows'], manifest['classes']
    group_sets = [{r['group'] for r in rows if r['split'] == s} for s in ['train', 'validation', 'test']]
    hash_sets = [{r['sha256'] for r in rows if r['split'] == s} for s in ['train', 'validation', 'test']]
    for sets in [group_sets, hash_sets]:
        if any(sets[i] & sets[j] for i in range(3) for j in range(i)):
            raise ValueError('Cross-split leakage detected')
    weights = MobileNet_V3_Small_Weights.DEFAULT
    model = mobilenet_v3_small(weights=weights).eval()
    model.classifier = nn.Identity()
    transform = weights.transforms()
    features = []
    with torch.inference_mode():
        for start in range(0, len(rows), 32):
            batch = []
            for row in rows[start:start+32]:
                with Image.open(args.manifest.parent / row['path']) as im:
                    batch.append(transform(im.convert('RGB')))
            features.append(model(torch.stack(batch)))
            print(f'Encoded {min(start+32, len(rows))}/{len(rows)}', flush=True)
    x = torch.cat(features).clone()
    y = torch.tensor([r['label'] for r in rows])
    masks = {s: torch.tensor([r['split'] == s for r in rows]) for s in ['train', 'validation', 'test']}
    head = nn.Linear(x.shape[1], len(classes))
    counts = torch.bincount(y[masks['train']], minlength=len(classes)).float()
    if (counts == 0).any():
        raise ValueError('Missing training class')
    loss_fn = nn.CrossEntropyLoss(weight=counts.sum() / (len(classes) * counts))
    optimiser = torch.optim.AdamW(head.parameters(), lr=.003, weight_decay=.01)
    best_loss, best_state, best_epoch = float('inf'), None, None
    for epoch in range(args.epochs):
        head.train()
        optimiser.zero_grad()
        loss = loss_fn(head(x[masks['train']]), y[masks['train']])
        loss.backward()
        optimiser.step()
        head.eval()
        with torch.no_grad():
            val = nn.functional.cross_entropy(head(x[masks['validation']]), y[masks['validation']]).item()
        if val < best_loss:
            best_loss, best_epoch = val, epoch + 1
            best_state = {k: v.detach().clone() for k, v in head.state_dict().items()}
    head.load_state_dict(best_state)
    with torch.no_grad():
        pred = head(x[masks['test']]).argmax(1).numpy()
    truth = y[masks['test']].numpy()
    metrics = {'status': 'experimental_not_for_deployment', 'archive': manifest['archive'],
               'classes': classes, 'best_epoch': best_epoch, 'grouping': manifest['grouping'],
               'classification_report': classification_report(truth, pred, labels=list(range(len(classes))), target_names=classes, output_dict=True, zero_division=0),
               'confusion_matrix': confusion_matrix(truth, pred, labels=list(range(len(classes)))).tolist(),
               'limitations': ['Preview results are not field validation', 'No toxin or nutrient inference',
                               'No validated rejection threshold', 'Metadata groups are not verified feed batches']}
    args.output.mkdir(parents=True, exist_ok=True)
    torch.save({'backbone': model.state_dict(), 'head': head.state_dict(), 'classes': classes,
                'weights': str(weights), 'status': metrics['status']}, args.output / 'image_baseline.pt')
    (args.output / 'metrics.json').write_text(json.dumps(metrics, indent=2), encoding='utf-8')
    print(json.dumps(metrics, indent=2))


if __name__ == '__main__':
    main()
