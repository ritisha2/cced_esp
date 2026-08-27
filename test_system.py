import asyncio
import json
import os
import sys
from datetime import datetime, timezone

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import DEFAULT_MQTT_CONFIG, DEFAULT_INGESTION_STATE, DB_PATH
from backend.database import db
from backend.mqtt_collector import MQTTCollector

async def test_database_and_collector():
    print(">>> 1. Initializing SQLite Database...")
    await db.init_db()
    print("    [OK] DB Initialized.")

    print(">>> 2. Testing Telemetry Ingestion into SQLite...")
    test_record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "asset_id": "ASSET-TEST-TX01",
        "well_id": "WELL-TEST-101",
        "topic": "opg/wells/ASSET-TEST-TX01/telemetry",
        "pressure_psi": 2450.5,
        "temperature_c": 75.2,
        "flow_rate_bpd": 1200.0,
        "gas_flow_mscfd": 650.0,
        "water_cut_pct": 20.5,
        "choke_size_pct": 50.0,
        "status": "NORMAL",
        "raw_payload": {"test": True, "battery": 24.5}
    }
    inserted_id = await db.insert_telemetry(test_record)
    assert inserted_id > 0, "Insert failed"
    print(f"    [OK] Inserted test record with ID: {inserted_id}")

    print(">>> 3. Testing Time-Series Query & Filters...")
    query_result = await db.get_telemetry(asset_id="ASSET-TEST-TX01", limit=10)
    assert query_result["total"] >= 1, "Failed to query back inserted record"
    record = query_result["records"][0]
    assert record["asset_id"] == "ASSET-TEST-TX01"
    assert record["well_id"] == "WELL-TEST-101"
    print(f"    [OK] Successfully retrieved record for {record['asset_id']} - {record['well_id']}")

    print(">>> 4. Testing Asset Summary Aggregation...")
    summary = await db.get_asset_summary()
    assert len(summary) >= 1
    print(f"    [OK] Asset summary returned {len(summary)} assets.")

    print(">>> 5. Testing MQTT Message Normalization & Filters...")
    collector = MQTTCollector(config=DEFAULT_MQTT_CONFIG, state=DEFAULT_INGESTION_STATE)
    
    # Test normalization from raw json
    norm = collector._normalize_record({
        "asset": "ASSET-NM-02",
        "well": "WELL-NM-201",
        "pressure": 3200,
        "temp_c": 85,
        "flow_rate": 1500
    }, topic="opg/wells/ASSET-NM-02/telemetry")
    assert norm["asset_id"] == "ASSET-NM-02"
    assert norm["pressure_psi"] == 3200.0
    print("    [OK] Normalization verified.")

    # Test Whitelist Filter
    collector.state.filter_mode = "WHITELIST"
    collector.state.allowed_asset_ids = ["ASSET-ALLOWED-01"]
    
    match_pass = collector._matches_filters({"asset_id": "ASSET-ALLOWED-01", "well_id": "W1", "pressure_psi": 2000})
    match_fail = collector._matches_filters({"asset_id": "ASSET-BLOCKED-02", "well_id": "W1", "pressure_psi": 2000})
    assert match_pass == True, "Allowed asset should pass"
    assert match_fail == False, "Non-allowed asset should be filtered"
    print("    [OK] Dynamic Ingestion Filters verified.")

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<\n")

if __name__ == "__main__":
    asyncio.run(test_database_and_collector())
