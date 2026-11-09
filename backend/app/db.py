import threading

import psycopg
from pgvector.psycopg import register_vector
from psycopg_pool import ConnectionPool

from app.config import settings

_pool = None
_pool_lock = threading.Lock()


def _configure(conn):
    register_vector(conn)


def _get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                pool = ConnectionPool(
                    settings.database_url,
                    min_size=1,
                    max_size=5,
                    # prepare_threshold=None keeps this safe behind Supabase's connection pooler
                    kwargs={"autocommit": True, "prepare_threshold": None},
                    configure=_configure,
                    check=ConnectionPool.check_connection,  # drops connections the server closed
                    open=False,
                    name="digital-me",
                )
                pool.open(wait=True, timeout=30)
                _pool = pool
    return _pool


def get_conn(register: bool = True):
    """Use as:  with get_conn() as conn: ...

    register=False gives a plain one-off connection (used before the vector type exists,
    e.g. when applying the schema).
    """
    if not register:
        return psycopg.connect(settings.database_url, autocommit=True)
    return _get_pool().connection()
