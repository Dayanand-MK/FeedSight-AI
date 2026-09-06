from multiprocessing.sharedctypes import Value
import random
from simulation.sensors.sensor_config import SENSOR_RANGES

def random_value(value_range, decimals = 2):
    minimum, maximum = value_range

    return round(
        random.uniform(minimum, maximum),
        decimals,
    )

def generate_sensor_reading(scenario : str = "good", feed_type : str = "maize_silage"):
    if scenario not in SENSOR_RANGES:
        raise ValueError(f"Unknown scenario: {scenario}")

    ranges = SENSOR_RANGES[scenario]

    return {
        "feed_type" : feed_type,
        "moisture" : random_value(ranges["moisture"]),
        "temperature" : random_value(ranges["temperature"]),
        "ph" : random_value(ranges["ph"]),
        "humidity" : random_value(ranges["humidity"]),
        "ammonia" : random_value(ranges["ammonia"]),
    }