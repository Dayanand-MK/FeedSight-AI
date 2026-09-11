import tempfile
import unittest
from pathlib import Path
import numpy as np
from PIL import Image
from ai.training.biomass import components, inside, preprocess


class BiomassTests(unittest.TestCase):
    def test_components_are_nonnegative_and_additive(self):
        values = components(np.array([[-3., 4., 2.]]))
        np.testing.assert_array_equal(values, [[0, 4, 2, 2, 6]])

    def test_image_path_cannot_escape_dataset(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaises(ValueError):
                inside(Path(root), '../outside.jpg')

    def test_preprocessing_preserves_both_halves(self):
        with tempfile.TemporaryDirectory() as root:
            p = Path(root) / 'image.png'
            pixels = np.zeros((2, 4, 3), dtype=np.uint8)
            pixels[:, :2, 0] = 255
            pixels[:, 2:, 2] = 255
            Image.fromarray(pixels).save(p)
            value = preprocess(p)
            self.assertEqual(value.shape, (3, 224, 448))
            self.assertAlmostEqual(float(value[0, 0, 0]), (1-.485)/.229, places=5)
            self.assertAlmostEqual(float(value[2, 0, 447]), (1-.406)/.225, places=5)


if __name__ == '__main__': unittest.main()
