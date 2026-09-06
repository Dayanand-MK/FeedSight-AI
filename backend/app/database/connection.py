import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]

DATABASE_DIR = BASE_DIR / "database"
DATABASE_PATH = DATABASE_DIR / "feedsight.db"

def get_connection():
    DATABASE_DIR.mkdir(parents = True, exist_ok = True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    return connection