import asyncio
import time
from backend.database import labelled_db, unlabelled_db

async def test():
    print("Testing unlabelled_db.get_telemetry...", flush=True)
    t0 = time.time()
    res = await unlabelled_db.get_telemetry(limit=5)
    print(f"get_telemetry took {time.time() - t0:.3f}s: records={len(res['records'])}", flush=True)

    print("Testing unlabelled_db.get_database_detailed_stats...", flush=True)
    t0 = time.time()
    stats = await unlabelled_db.get_database_detailed_stats()
    print(f"get_database_detailed_stats took {time.time() - t0:.3f}s: {stats}", flush=True)

asyncio.run(test())
