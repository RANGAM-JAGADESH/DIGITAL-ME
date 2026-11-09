from pathlib import Path

from app.db import get_conn

SQL = Path(__file__).resolve().parents[1] / "sql" / "schema.sql"

# register=False because the vector type does not exist until this script creates it
with get_conn(register=False) as conn:
    conn.execute(SQL.read_text(encoding="utf-8"))
print("schema applied")