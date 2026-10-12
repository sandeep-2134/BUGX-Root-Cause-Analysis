import unittest
from app.calculator import divide_values

class TestCalculator(unittest.TestCase):
    def test_divide_by_zero_reproduction(self):
        # Expects safe handling or non-zero crash
        result = divide_values(10, 0)
        self.assertIsNotNone(result)

if __name__ == "__main__":
    unittest.main()
