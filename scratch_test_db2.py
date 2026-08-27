import asyncio
import time
from backend.database import unlabelled_db, labelled_db

async def main():
    print("Testing unlabelled_db stats...", flush=True)
    t0 = time.time()
    s1 = await unlabelled_db.get_database_detailed_stats()
    print(f"unlabelled_db stats took {time.time() - t0:.3f}s: {s1}", flush=True)

    print("Testing labelled_db stats...", flush=True)
    t0 = time.time()
    s2 = await labelled_db.get_database_detailed_stats()
    print(f"labelled_db stats took {time.time() - t0:.3f}s: {s2}", flush=True)

asyncio.run(main())
