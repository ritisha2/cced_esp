"""
Label Stripper Worker & Pipeline Tool.
Reads records from labelled.db, strips pre-defined fault and scenario labels,
and persists raw unlabelled sensor measurements into unlabelled.db.
"""

import asyncio
import aiosqlite
import logging
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.database import labelled_db, unlabelled_db
from backend.config import LABELLED_DB_PATH, UNLABELLED_DB_PATH

logger = logging.getLogger("esp.label_stripper")

def strip_labels_from_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Strips all ground truth labels, scenario tags, and alarm heuristics from raw telemetry."""
    unlabelled = dict(record)
    unlabelled["data_category"] = "UNLABELLED"
    unlabelled["scenario"] = "unlabelled"
    unlabelled["alarms"] = "[]"
    unlabelled["alerts"] = "[]"
    unlabelled["trip_cause"] = ""
    unlabelled["status"] = "UNLABELLED"
    unlabelled["operating_state"] = "unlabelled"
    return unlabelled

async def sync_labelled_to_unlabelled() -> int:
    """Syncs existing records from labelled.db to unlabelled.db stripping all scenario labels."""
    await labelled_db.init_db()
    await unlabelled_db.init_db()
    
    async with aiosqlite.connect(LABELLED_DB_PATH) as src_db, aiosqlite.connect(UNLABELLED_DB_PATH) as dest_db:
        # Read from source
        async with src_db.execute("SELECT * FROM opg_well_telemetry ORDER BY id ASC;") as cursor:
            rows = await cursor.fetchall()
            col_names = [d[0] for d in cursor.description]

        if not rows:
            logger.info("No records in labelled.db to sync.")
            return 0

        logger.info(f"Syncing {len(rows)} records from labelled.db to unlabelled.db (stripping labels)...")
        
        scenario_idx = col_names.index("scenario") if "scenario" in col_names else -1
        category_idx = col_names.index("data_category") if "data_category" in col_names else -1
        status_idx = col_names.index("status") if "status" in col_names else -1
        alarms_idx = col_names.index("alarms") if "alarms" in col_names else -1
        alerts_idx = col_names.index("alerts") if "alerts" in col_names else -1
        trip_idx = col_names.index("trip_cause") if "trip_cause" in col_names else -1
        op_state_idx = col_names.index("operating_state") if "operating_state" in col_names else -1

        stripped_rows = []
        for r in rows:
            r_list = list(r)
            if scenario_idx >= 0: r_list[scenario_idx] = "unlabelled"
            if category_idx >= 0: r_list[category_idx] = "UNLABELLED"
            if status_idx >= 0: r_list[status_idx] = "UNLABELLED"
            if alarms_idx >= 0: r_list[alarms_idx] = "[]"
            if alerts_idx >= 0: r_list[alerts_idx] = "[]"
            if trip_idx >= 0: r_list[trip_idx] = ""
            if op_state_idx >= 0: r_list[op_state_idx] = "unlabelled"
            stripped_rows.append(tuple(r_list))

        placeholders = ", ".join(["?"] * len(col_names))
        cols_str = ", ".join(col_names)
        await dest_db.executemany(f"INSERT OR REPLACE INTO opg_well_telemetry ({cols_str}) VALUES ({placeholders});", stripped_rows)
        await dest_db.commit()

        logger.info(f"Successfully synced {len(stripped_rows)} stripped records into unlabelled.db.")
        return len(stripped_rows)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(sync_labelled_to_unlabelled())
