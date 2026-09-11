"""Prepare maize-only GrainSet images with conservative metadata-group splits.

Works with official tiny or full archives. No random image-level splitting.
Metadata groups are proxies, NOT verified farm/batch identifiers.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

from sklearn.model_selection import GroupShuffleSplit

CLASSES = ['normal_appearance', 'visible_mould', 'other_defect_or_impurity']
KNOWN = {'NOR', 'MY', 'BN', 'SD', 'AP', 'F&S', 'HD', 'IM'}


def label(code):
    if code not in KNOWN:
        raise ValueError(f'Unrecognised source label: {code}')
    return 0 if code == 'NOR' else 1 if code == 'MY' else 2


def split_rows(rows):
    groups = [r['group'] for r in rows]
    # Choose solely for class coverage, never using model performance.
    for seed in range(42, 242):
        train, rest = next(GroupShuffleSplit(n_splits=1, test_size=.3, random_state=seed).split(rows, groups=groups))
        val, test = next(GroupShuffleSplit(n_splits=1, test_size=.5, random_state=seed).split(rest, groups=[groups[i] for i in rest]))
        splits = {'train': train, 'validation': rest[val], 'test': rest[test]}
        if all({rows[i]['label'] for i in indices} == {0, 1, 2} for indices in splits.values()):
            for name, indices in splits.items():
                for i in indices:
                    rows[i]['split'] = name
            return seed
    raise ValueError('Insufficient independent groups with all classes; acquire more data.')


def prepare(archive, annotations, output):
    records = {}
    for obj in ET.parse(annotations).getroot().findall('object'):
        fields = {x.tag: x.text for x in obj}
        if fields['species'] != 'maize':
            continue
        key = fields['ID']
        if key in records:
            raise ValueError(f'Duplicate annotation: {key}')
        records[key] = fields
    output.mkdir(parents=True, exist_ok=True)
    rows, seen = [], {}
    with zipfile.ZipFile(archive) as z:
        for member in z.infolist():
            p = Path(member.filename)
            if any(part.lower() in {'mask', 'masks', '__macosx'} for part in p.parts):
                continue
            if p.suffix.lower() not in {'.png', '.jpg', '.jpeg'} or p.stem not in records:
                continue
            fields = records[p.stem]
            data = z.read(member)
            digest = hashlib.sha256(data).hexdigest()
            target = label(fields['DU_grain'])
            if digest in seen:
                if seen[digest] != target:
                    raise ValueError('Conflicting duplicate image labels')
                continue
            seen[digest] = target
            # Never use archive paths as extraction destinations.
            filename = digest + p.suffix.lower()
            (output / filename).write_bytes(data)
            group = '|'.join(fields.get(k) or 'unknown' for k in ['location', 'time', 'sub-species'])
            rows.append({'path': filename, 'source_id': p.stem, 'source_label': fields['DU_grain'],
                         'label': target, 'sha256': digest, 'group': group})
    if not rows:
        raise ValueError('No images matched official maize annotations')
    seed = split_rows(rows)
    result = {'classes': CLASSES, 'seed': seed, 'archive': archive.name,
              'scope': 'Research only: isolated maize kernels; no safety clearance',
              'grouping': 'location + collection time + sub-species; batch identities unavailable',
              'rows': rows}
    (output / 'manifest.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    summary = {s: dict(collections.Counter(CLASSES[r['label']] for r in rows if r['split'] == s))
               for s in ['train', 'validation', 'test']}
    print(json.dumps(summary, indent=2))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--annotations', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    prepare(args.archive, args.annotations, args.output)
