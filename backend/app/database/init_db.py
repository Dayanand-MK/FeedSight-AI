from backend.app.database.connection import get_connection

def initialize_database():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sample_id TEXT UNIQUE NOT NULL,
        feed_type TEXT NOT NULL,

        moisture REAL NOT NULL,
        temperature REAL NOT NULL,
        ph REAL NOT NULL,
        humidity REAl NOT NULL,
        ammonia REAL,

        quality_class TEXT NOT NULL,
        quality_score REAL NULL NULL,
        spoilage_risk TEXT NOT NULL,
        confidence REAl NOT NULL,

        alerts TEXT,
        recommendation TEXT,

        synced INTEGER DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    connection.commit()
    connection.close()