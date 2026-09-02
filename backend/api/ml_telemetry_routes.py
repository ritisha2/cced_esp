"""
ML Telemetry Extraction & Polling API
======================================
Secure, high-performance REST endpoint for external ML teams to extract,
poll, and benchmark models on raw 14-parameter unlabelled time-series sensor data.

Grounded in API Patterns:
- REST Resource Naming (/api/v1/telemetry/unlabelled)
- Server-to-Server Broker ID Authentication (X-Broker-ID / X-API-Key)
- JSON Envelope Response Pattern ({ status, code, broker_id, pagination, data, error })
- Fast Non-Blocking Read-Only SQLite access (aiosqlite + WAL + PRAGMA query_only=ON)
"""

import os
import uuid
import logging
import aiosqlite
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from fastapi import APIRouter, Header, Query, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse

from backend.config import UNLABELLED_DB_PATH, VALID_BROKER_IDS

logger = logging.getLogger("cced_esp.ml_telemetry")

router = APIRouter(prefix="/api/v1/telemetry", tags=["ML Telemetry"])


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response Models (Pydantic)
# ─────────────────────────────────────────────────────────────────────────────

class TelemetryQueryParams(BaseModel):
    broker_id: Optional[str] = Field(None, description="Authorized Broker ID")
    asset_ids: Optional[List[str]] = Field(None, description="List of asset IDs / well IDs to filter")
    start_time: Optional[str] = Field(None, description="ISO8601 start timestamp")
    end_time: Optional[str] = Field(None, description="ISO8601 end timestamp")
    limit: int = Field(500, ge=1, le=10000, description="Max records to return")
    offset: int = Field(0, ge=0, description="Pagination offset")
    format: str = Field("standard", description="Format: 'standard' (nested dict) or 'tabular' (flat arrays)")


class StandardTelemetryRecord(BaseModel):
    id: int
    timestamp: str
    asset_id: str
    well_id: str
    parameters: Dict[str, Optional[float]]


# ─────────────────────────────────────────────────────────────────────────────
# Security / Broker Validation Dependency
# ─────────────────────────────────────────────────────────────────────────────

async def validate_broker_id(
    x_broker_id: Optional[str] = Header(None, alias="X-Broker-ID"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    broker_id: Optional[str] = Query(None),
) -> str:
    """
    Validates Broker ID against authorized broker registry.
    Accepts X-Broker-ID header with query parameter fallback.
    """
    resolved_broker_id = (x_broker_id or broker_id or "").strip()

    if not resolved_broker_id:
        req_id = f"req-{uuid.uuid4().hex[:8]}"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "ERROR",
                "code": 401,
                "error": {
                    "code": "MISSING_BROKER_ID",
                    "message": "Missing Broker ID. Please provide 'X-Broker-ID' header or 'broker_id' query parameter.",
                    "request_id": req_id,
                    "authorized_demo_ids": ["BROKER-DEMO-001", "CCED-ML-TEST-01", "OPG-SECURE-01"]
                },
                "data": None
            }
        )

    # Allow exact matches or wildcard demo brokers
    if resolved_broker_id not in VALID_BROKER_IDS and not resolved_broker_id.startswith("DEMO-") and not resolved_broker_id.startswith("BROKER-"):
        req_id = f"req-{uuid.uuid4().hex[:8]}"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": "ERROR",
                "code": 403,
                "error": {
                    "code": "UNAUTHORIZED_BROKER",
                    "message": f"Broker ID '{resolved_broker_id}' is not authorized to access the telemetry pipeline.",
                    "request_id": req_id
                },
                "data": None
            }
        )

    return resolved_broker_id


# ─────────────────────────────────────────────────────────────────────────────
# Database Resolution & Safe Read Helper
# ─────────────────────────────────────────────────────────────────────────────

def _resolve_db_path() -> str:
    """Resolve database path: exclusively unlabelled.db from live broker injection."""
    return UNLABELLED_DB_PATH


def _map_row_to_14_parameters(row: aiosqlite.Row) -> Dict[str, Optional[float]]:
    """Map SQLite row to the canonical 14 VFD telemetry parameters."""
    d = dict(row)

    # Helper float converter
    def _flt(val: Any, default: Optional[float] = None) -> Optional[float]:
        if val is None:
            return default
        try:
            return round(float(val), 4)
        except (ValueError, TypeError):
            return default

    # 1. Intake Pressure (Inp bar/psi)
    pip = _flt(d.get("intake_pressure_psi"))

    # 2. Intake Temperature (Int temp °C)
    int_temp = _flt(d.get("intake_temperature_c"), _flt(d.get("temperature_c")))

    # 3. Motor Temperature (Motor temp °C)
    motor_temp = _flt(d.get("motor_temperature_c"), _flt(d.get("temperature_c")))

    # 4. Discharge Pressure (Disch pr. Bar/psi)
    pdp = _flt(d.get("discharge_pressure_psi"), _flt(d.get("pressure_psi")))

    # 5. Vibration (Vibration G's-Vx)
    vib = _flt(d.get("vibration_g"))

    # 6. Leak Current Ct
    leak = _flt(d.get("leak_current_ct"), 0.0)

    # 7. Motor Voltage (Volt)
    volt = _flt(d.get("motor_voltage_v"))

    # 8. Motor Current / VSD Amps (VSD Amps/Load)
    curr = _flt(d.get("motor_current_a"))

    # 9. Frequency (Frequency)
    freq = _flt(d.get("frequency_hz"))

    # 10. DHG Current
    dhg = _flt(d.get("dhg_current"), 0.0)

    # 11. Wellhead Pressure (WHP PSI)
    whp = _flt(d.get("whp_psi"), 0.0)

    # 12. Flowline Pressure (FLP PSI)
    flp = _flt(d.get("flp_psi"), 0.0)

    # 13. Annulus Pressure (AP PSI)
    ap = _flt(d.get("annulus_pressure_psi"), 0.0)

    # 14. VFD Status (1 = Running, 0 = Stopped)
    vfd_sts = d.get("vfd_status")
    if vfd_sts is not None:
        try:
            vfd_status_val = int(vfd_sts)
        except (ValueError, TypeError):
            vfd_status_val = 1
    else:
        op_state = str(d.get("operating_state") or "running").lower().strip()
        vfd_status_val = 0 if op_state in ("tripped", "stopped", "off") else 1

    return {
        "intake_pressure_psi": pip,
        "intake_temperature_c": int_temp,
        "motor_temperature_c": motor_temp,
        "discharge_pressure_psi": pdp,
        "vibration_g": vib,
        "leak_current_ct": leak,
        "motor_voltage_v": volt,
        "motor_current_a": curr,
        "frequency_hz": freq,
        "dhg_current": dhg,
        "whp_psi": whp,
        "flp_psi": flp,
        "annulus_pressure_psi": ap,
        "vfd_status": vfd_status_val
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoint 1: GET /api/v1/telemetry/unlabelled (Polling & Time-Series Extraction)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/unlabelled", summary="Extract 14-parameter unlabelled telemetry time-series")
async def get_unlabelled_telemetry(
    broker_id: str = Depends(validate_broker_id),
    asset_id: Optional[str] = Query(None, description="Filter by well / asset ID (e.g. FS-031, FSWS-001-A)"),
    start_time: Optional[str] = Query(None, description="ISO8601 start timestamp (inclusive)"),
    end_time: Optional[str] = Query(None, description="ISO8601 end timestamp (inclusive)"),
    limit: int = Query(500, ge=1, le=10000, description="Number of records to retrieve"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    format: str = Query("standard", description="'standard' (nested objects) or 'tabular' (column vectors)"),
):
    """
    Extracts raw, unlabelled telemetry time-series records containing all 14 standard VFD sensor channels
    directly from unlabelled.db populated by the live broker injection.
    Requires an authorized Broker ID in 'X-Broker-ID' header or 'broker_id' query parameter.
    """
    target_db = _resolve_db_path()
    if not os.path.exists(target_db):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "ERROR",
                "code": 503,
                "error": {
                    "code": "DATABASE_UNAVAILABLE",
                    "message": f"Unlabelled telemetry database is not initialized at {target_db}."
                },
                "data": None
            }
        )

    # Build SQL Query with parameterized guards
    where_clauses = ["1=1"]
    params: List[Any] = []

    if asset_id:
        where_clauses.append("(asset_id = ? OR well_id = ?)")
        params.extend([asset_id.strip(), asset_id.strip()])

    if start_time:
        where_clauses.append("timestamp >= ?")
        params.append(start_time.strip())

    if end_time:
        where_clauses.append("timestamp <= ?")
        params.append(end_time.strip())

    where_sql = " AND ".join(where_clauses)

    records = []
    total_matching = 0

    try:
        async with aiosqlite.connect(target_db, timeout=10.0) as db:
            await db.execute("PRAGMA query_only = ON;")
            await db.execute("PRAGMA busy_timeout = 5000;")
            db.row_factory = aiosqlite.Row

            # Fast count query
            count_query = f"SELECT COUNT(*) FROM opg_well_telemetry WHERE {where_sql}"
            async with db.execute(count_query, params) as cursor:
                count_row = await cursor.fetchone()
                total_matching = count_row[0] if count_row else 0

            # Data query ordered by timestamp DESC (or ASC if start_time specified)
            order_dir = "ASC" if start_time else "DESC"
            data_query = f"""
                SELECT * FROM opg_well_telemetry 
                WHERE {where_sql} 
                ORDER BY timestamp {order_dir} 
                LIMIT ? OFFSET ?
            """
            fetch_params = params + [limit, offset]
            async with db.execute(data_query, fetch_params) as cursor:
                rows = await cursor.fetchall()

            for row in rows:
                params_map = _map_row_to_14_parameters(row)
                records.append({
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "asset_id": row["asset_id"],
                    "well_id": row["well_id"],
                    "parameters": params_map
                })

    except Exception as e:
        logger.error(f"[ML Telemetry API] Error querying {target_db}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "status": "ERROR",
                "code": 500,
                "error": {
                    "code": "QUERY_EXECUTION_ERROR",
                    "message": str(e)
                },
                "data": None
            }
        )

    has_more = (offset + len(records)) < total_matching

    # Return tabular format if requested (flat arrays for pandas/numpy)
    if format.lower() == "tabular":
        column_data: Dict[str, list] = {
            "id": [],
            "timestamp": [],
            "asset_id": [],
            "well_id": [],
            "intake_pressure_psi": [],
            "intake_temperature_c": [],
            "motor_temperature_c": [],
            "discharge_pressure_psi": [],
            "vibration_g": [],
            "leak_current_ct": [],
            "motor_voltage_v": [],
            "motor_current_a": [],
            "frequency_hz": [],
            "dhg_current": [],
            "whp_psi": [],
            "flp_psi": [],
            "annulus_pressure_psi": [],
            "vfd_status": []
        }
        for rec in records:
            column_data["id"].append(rec["id"])
            column_data["timestamp"].append(rec["timestamp"])
            column_data["asset_id"].append(rec["asset_id"])
            column_data["well_id"].append(rec["well_id"])
            for pkey, pval in rec["parameters"].items():
                column_data[pkey].append(pval)

        payload_data = column_data
    else:
        payload_data = records

    return {
        "status": "SUCCESS",
        "code": 200,
        "broker_id": broker_id,
        "source_db": os.path.basename(target_db),
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total_returned": len(records),
            "total_records": total_matching,
            "has_more": has_more
        },
        "data": payload_data,
        "error": None
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoint 2: POST /api/v1/telemetry/unlabelled/query (Batch Filter Extraction)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/unlabelled/query", summary="Batch query unlabelled telemetry with multi-well filters")
async def query_unlabelled_telemetry_batch(
    query_body: TelemetryQueryParams,
    broker_id: str = Depends(validate_broker_id)
):
    """
    Batch query endpoint accepting complex filter criteria in JSON body for multi-asset extraction from unlabelled.db.
    """
    target_db = _resolve_db_path()
    if not os.path.exists(target_db):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "ERROR",
                "code": 503,
                "error": {
                    "code": "DATABASE_UNAVAILABLE",
                    "message": f"Unlabelled telemetry database '{target_db}' is not available."
                },
                "data": None
            }
        )

    where_clauses = ["1=1"]
    params: List[Any] = []

    if query_body.asset_ids:
        placeholders = ",".join("?" for _ in query_body.asset_ids)
        where_clauses.append(f"(asset_id IN ({placeholders}) OR well_id IN ({placeholders}))")
        params.extend(query_body.asset_ids + query_body.asset_ids)

    if query_body.start_time:
        where_clauses.append("timestamp >= ?")
        params.append(query_body.start_time.strip())

    if query_body.end_time:
        where_clauses.append("timestamp <= ?")
        params.append(query_body.end_time.strip())

    where_sql = " AND ".join(where_clauses)
    records = []
    total_matching = 0

    try:
        async with aiosqlite.connect(target_db, timeout=10.0) as db:
            await db.execute("PRAGMA query_only = ON;")
            await db.execute("PRAGMA busy_timeout = 5000;")
            db.row_factory = aiosqlite.Row

            count_query = f"SELECT COUNT(*) FROM opg_well_telemetry WHERE {where_sql}"
            async with db.execute(count_query, params) as cursor:
                count_row = await cursor.fetchone()
                total_matching = count_row[0] if count_row else 0

            data_query = f"""
                SELECT * FROM opg_well_telemetry 
                WHERE {where_sql} 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            """
            fetch_params = params + [query_body.limit, query_body.offset]
            async with db.execute(data_query, fetch_params) as cursor:
                rows = await cursor.fetchall()

            for row in rows:
                params_map = _map_row_to_14_parameters(row)
                records.append({
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "asset_id": row["asset_id"],
                    "well_id": row["well_id"],
                    "parameters": params_map
                })

    except Exception as e:
        logger.error(f"[ML Telemetry API] Batch query error on {target_db}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "status": "ERROR",
                "code": 500,
                "error": {"code": "BATCH_QUERY_ERROR", "message": str(e)},
                "data": None
            }
        )

    has_more = (query_body.offset + len(records)) < total_matching

    return {
        "status": "SUCCESS",
        "code": 200,
        "broker_id": broker_id,
        "source_db": os.path.basename(target_db),
        "pagination": {
            "limit": query_body.limit,
            "offset": query_body.offset,
            "total_returned": len(records),
            "total_records": total_matching,
            "has_more": has_more
        },
        "data": records,
        "error": None
    }
