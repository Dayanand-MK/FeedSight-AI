"""Download checksum-verified, version-pinned official GrainSet files."""
import argparse
import hashlib
from pathlib import Path
import urllib.request

FILES = {
    'annotations': ('maize.xml', 40763588, '3e5db4c712e0d51a44ff5cb7e7d2acb2'),
    'preview': ('GrainSet-tiny.zip', 40761737, 'd9cc96c1d66955d05ac5cc34accd8bba'),
    'full': ('maize.zip', 40737164, '517d21f98728577b90bfd5e5c4100a24'),
}


def download(kind, folder):
    name, file_id, expected = FILES[kind]
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / name
    def valid(path):
        if not path.exists():
            return False
        with path.open('rb') as stream:
            return hashlib.file_digest(stream, 'md5').hexdigest() == expected
    if valid(dest):
        print(f'Already verified: {name}', flush=True)
        return
    partial = folder / (name + '.partial')
    with urllib.request.urlopen(f'https://ndownloader.figshare.com/files/{file_id}', timeout=120) as response, partial.open('wb') as out:
        while block := response.read(1024 * 1024):
            out.write(block)
    if not valid(partial):
        raise ValueError(f'Checksum mismatch: {partial}; not promoted to dataset')
    partial.replace(dest)
    print(f'Downloaded and verified: {name}', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--kind', choices=['preview', 'full'], default='preview')
    parser.add_argument('--output', type=Path, default=Path('ai/datasets/image-downloads'))
    args = parser.parse_args()
    download('annotations', args.output)
    download(args.kind, args.output)
