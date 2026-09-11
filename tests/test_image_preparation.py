import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch
import zipfile

from ai.training.prepare_grainset import label, split_rows, prepare


class ImagePreparationTests(unittest.TestCase):
    def test_masks_are_excluded_even_when_ids_match(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            xml = root / 'maize.xml'
            xml.write_text('<annotation><object><ID>kernel</ID><species>maize</species><DU_grain>NOR</DU_grain></object></annotation>')
            archive = root / 'images.zip'
            with zipfile.ZipFile(archive, 'w') as z:
                z.writestr('maize/mask/kernel.png', b'mask')
                z.writestr('maize/train/kernel.png', b'photo')
            def assign(rows):
                for row in rows:
                    row['split'] = 'train'
                return 42
            with patch('ai.training.prepare_grainset.split_rows', side_effect=assign):
                result = prepare(archive, xml, root / 'prepared')
            self.assertEqual(len(result['rows']), 1)
            self.assertEqual((root / 'prepared' / result['rows'][0]['path']).read_bytes(), b'photo')

    def test_unknown_source_labels_fail_closed(self):
        self.assertEqual(label('NOR'), 0)
        self.assertEqual(label('MY'), 1)
        self.assertEqual(label('IM'), 2)
        with self.assertRaises(ValueError):
            label('healthy')

    def test_metadata_groups_never_cross_splits(self):
        rows = [{'group': str(g), 'label': c} for g in range(30) for c in range(3)]
        split_rows(rows)
        by_group = {}
        for row in rows:
            by_group.setdefault(row['group'], set()).add(row['split'])
        self.assertTrue(all(len(splits) == 1 for splits in by_group.values()))
        for split in ['train', 'validation', 'test']:
            self.assertEqual({r['label'] for r in rows if r['split'] == split}, {0, 1, 2})


if __name__ == '__main__':
    unittest.main()
