import sqlite3
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'data' / 'opg_wells.db'
if not DB_PATH.exists():
    # Fallback to labelled or unlabelled db
    DB_PATH = BASE_DIR / 'data' / 'labelled.db'
    if not DB_PATH.exists():
        DB_PATH = BASE_DIR / 'data' / 'unlabelled.db'

conn = sqlite3.connect(str(DB_PATH))
cursor = conn.cursor()

print("=== 1. SCENARIOS DETECTED IN DATASET ===")
cursor.execute("SELECT scenario, COUNT(*) FROM opg_well_telemetry WHERE data_category='LABELLED' GROUP BY scenario ORDER BY COUNT(*) DESC")
for row in cursor.fetchall():
    print(f"  - {row[0]}: {row[1]:,} records")

print("\n=== 2. OPERATING STATES & TRIP CAUSES ===")
cursor.execute("SELECT operating_state, trip_cause, COUNT(*) FROM opg_well_telemetry WHERE data_category='LABELLED' GROUP BY operating_state, trip_cause ORDER BY COUNT(*) DESC")
for row in cursor.fetchall():
    trip = row[1] if row[1] else "Normal Operation"
    print(f"  - State: [{row[0].upper()}] | Trip Cause: {trip} | Count: {row[2]:,}")

print("\n=== 3. ALARM TAGS OBSERVED ===")
cursor.execute("SELECT alarms, COUNT(*) FROM opg_well_telemetry WHERE data_category='LABELLED' AND alarms != '[]' AND alarms IS NOT NULL GROUP BY alarms ORDER BY COUNT(*) DESC")
for row in cursor.fetchall():
    print(f"  - Alarms: {row[0]} | Count: {row[1]:,}")

print("\n=== 4. SENSOR PARAMETER RANGES (Min / Avg / Max) ===")
metrics = [
    ("Discharge Pressure (PSI)", "pressure_psi"),
    ("Intake Pressure (PSI)", "intake_pressure_psi"),
    ("Flow Rate (BPD)", "flow_rate_bpd"),
    ("Motor Temp (°C)", "temperature_c"),
    ("Frequency (Hz)", "frequency_hz"),
    ("Motor Current (A)", "motor_current_a"),
    ("Motor Voltage (V)", "motor_voltage_v"),
    ("Vibration (g)", "vibration_g"),
    ("Water Cut (%)", "water_cut_pct")
]
for name, col in metrics:
    cursor.execute(f"SELECT MIN({col}), AVG({col}), MAX({col}) FROM opg_well_telemetry WHERE data_category='LABELLED'")
    r = cursor.fetchone()
    print(f"  - {name:<26}: Min={r[0]:>8.2f} | Avg={r[1]:>8.2f} | Max={r[2]:>8.2f}")

print("\n=== 5. PUMP MODELS & FLEET CLUSTERS ===")
cursor.execute("""
    SELECT 
        CASE 
            WHEN asset_id LIKE '%TD650%' THEN 'TD650 (High Flow)'
            WHEN asset_id LIKE '%B400%' THEN 'B400 Series'
            WHEN asset_id LIKE '%PMSND%' THEN 'PMSND Series'
            WHEN asset_id LIKE '%FlexER%' THEN 'FlexER Series'
            ELSE 'Standard ESP'
        END as pump_family,
        COUNT(DISTINCT well_id) as well_count,
        COUNT(*) as total_records
    FROM opg_well_telemetry
    WHERE data_category='LABELLED'
    GROUP BY pump_family
    ORDER BY total_records DESC
""")
for row in cursor.fetchall():
    print(f"  - Pump Family: {row[0]:<20} | Wells: {row[1]:>2} | Records: {row[2]:,}")

# Inspect raw_payload fields
cursor.execute("SELECT raw_payload FROM opg_well_telemetry WHERE data_category='LABELLED' LIMIT 5")
print("\n=== 6. RAW JSON KEYS DETECTED IN PAYLOADS ===")
for r in cursor.fetchall():
    try:
        data = json.loads(r[0])
        meas = data.get("measurements", {})
        print("  - Top Keys:", list(data.keys()))
        print("  - Measurement Keys:", list(meas.keys()))
        break
    except Exception:
        pass

conn.close()
