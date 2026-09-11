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
        source TEXT NOT NULL DEFAULT 'legacy_unknown',

        moisture REAL NOT NULL,
        temperature REAL NOT NULL,
        ph REAL NOT NULL,
        humidity REAl NOT NULL,
        ammonia REAL,

        quality_class TEXT NOT NULL,
        quality_score REAL NOT NULL,
        spoilage_risk TEXT NOT NULL,
        confidence REAL,

        alerts TEXT,
        recommendation TEXT,

        synced INTEGER DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Existing installations used a required invented confidence. Preserve all rows
    # and make that column nullable using SQLite's transactional table migration.
    columns = cursor.execute("PRAGMA table_info(assessments)").fetchall()
    if any(row[1] == "confidence" and row[3] for row in columns):
        import re
        connection.execute("BEGIN")
        try:
            sql = cursor.execute("SELECT sql FROM sqlite_master WHERE name='assessments'").fetchone()[0]
            migrated = re.sub(r'confidence\s+real\s+not\s+null', 'confidence REAL', sql, flags=re.I)
            migrated = re.sub(r'CREATE TABLE\s+assessments', 'CREATE TABLE assessments_nullable', migrated, count=1, flags=re.I)
            cursor.execute(migrated)
            names = ', '.join('"' + row[1] + '"' for row in columns)
            cursor.execute(f"INSERT INTO assessments_nullable ({names}) SELECT {names} FROM assessments")
            cursor.execute("DROP TABLE assessments")
            cursor.execute("ALTER TABLE assessments_nullable RENAME TO assessments")
        except Exception:
            connection.rollback()
            raise
    if not any(row[1] == "source" for row in cursor.execute("PRAGMA table_info(assessments)").fetchall()):
        cursor.execute("ALTER TABLE assessments ADD COLUMN source TEXT NOT NULL DEFAULT 'legacy_unknown'")
    connection.commit()
    connection.close()
