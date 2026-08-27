import sqlite3
import json

conn = sqlite3.connect('data/opg_wells.db')
cursor = conn.cursor()

# Ensure columns exist
cols = [r[1] for r in cursor.execute('PRAGMA table_info(opg_well_telemetry)').fetchall()]
if 'data_category' not in cols:
    cursor.execute("ALTER TABLE opg_well_telemetry ADD COLUMN data_category TEXT DEFAULT 'LABELLED'")
if 'scenario' not in cols:
    cursor.execute("ALTER TABLE opg_well_telemetry ADD COLUMN scenario TEXT DEFAULT 'normal'")
if 'alarms' not in cols:
    cursor.execute("ALTER TABLE opg_well_telemetry ADD COLUMN alarms TEXT DEFAULT '[]'")
if 'alerts' not in cols:
    cursor.execute("ALTER TABLE opg_well_telemetry ADD COLUMN alerts TEXT DEFAULT '[]'")
conn.commit()

# Read all existing records
cursor.execute('SELECT id, timestamp, asset_id, well_id, topic, pressure_psi, intake_pressure_psi, temperature_c, flow_rate_bpd, frequency_hz, motor_current_a, motor_voltage_v, vibration_g, water_cut_pct, gas_flow_mscfd, choke_size_pct, operating_state, trip_cause, status, raw_payload FROM opg_well_telemetry WHERE data_category IS NULL OR data_category = "LABELLED"')
rows = cursor.fetchall()
print(f"Migrating {len(rows)} records into Labelled & Unlabelled datasets...")

labelled_updates = []
unlabelled_inserts = []

for r in rows:
    row_id = r[0]
    ts, asset, well, topic = r[1], r[2], r[3], r[4]
    p, ip, temp, flow, freq, curr, volt, vib, wc, gas, choke = r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15]
    op_state, trip, status, raw_str = r[16], r[17], r[18], r[19]

    try:
        raw_data = json.loads(raw_str) if isinstance(raw_str, str) else (raw_str or {})
    except Exception:
        raw_data = {}

    scen = raw_data.get('scenario') or 'normal'
    alms = json.dumps(raw_data.get('alarms') or [])
    alts = json.dumps(raw_data.get('alerts') or [])

    labelled_updates.append(('LABELLED', scen, alms, alts, row_id))

    unlabelled_inserts.append((
        ts, asset, well, topic, 'UNLABELLED', '', '[]', '[]',
        p, ip, temp, flow, freq, curr, volt, vib, wc, gas, choke,
        'unlabelled', '', 'UNLABELLED', '{}'
    ))

cursor.executemany("""
    UPDATE opg_well_telemetry SET
        data_category = ?,
        scenario = ?,
        alarms = ?,
        alerts = ?
    WHERE id = ?
""", labelled_updates)

cursor.executemany("""
    INSERT INTO opg_well_telemetry (
        timestamp, asset_id, well_id, topic, data_category, scenario, alarms, alerts,
        pressure_psi, intake_pressure_psi, temperature_c, flow_rate_bpd,
        frequency_hz, motor_current_a, motor_voltage_v, vibration_g,
        water_cut_pct, gas_flow_mscfd, choke_size_pct,
        operating_state, trip_cause, status, raw_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", unlabelled_inserts)

conn.commit()
conn.close()
print("Migration successfully completed! Both Labelled & Unlabelled datasets are ready.")
