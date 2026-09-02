"""
Idempotent, non-destructive migration — native 14-parameter VFD columns (Plan.md X2).

Adds the 9 native VFD columns that complete the 14-signal broker schema to the
`opg_well_telemetry` table in each target database. The other 5 of the 14 VFD signals
already map to long-standing legacy columns (intake_pressure_psi, motor_current_a,
motor_voltage_v, frequency_hz, vibration_g), so only these 9 are "native" additions.

SAFETY
------
- Uses `ALTER TABLE ... ADD COLUMN ... DEFAULT NULL` only. SQLite ADD COLUMN is O(1)
  metadata-only and never rewrites or touches existing rows — the 1.976M rows in
  unlabelled.db and every row in labelled.db are left byte-for-byte unchanged.
- Idempotent: each column is checked against PRAGMA table_info first and skipped if
  present, so re-running is a no-op. unlabelled.db (already migrated) will report all
  columns present.
- NEVER drops, truncates, or rewrites any table or data. No DROP, no DELETE, no
  CREATE ... AS SELECT rewrite.

USAGE (run yourself on your local terminal — faster than IDE, per project convention):
    cd X:\\TAS\\Agentic_project\\cced_esp
    python scripts\\migrate_native_vfd_columns.py            # migrate labelled.db + unlabelled.db
    python scripts\\migrate_native_vfd_columns.py --dry-run  # show what WOULD change, touch nothing
    python scripts\\migrate_native_vfd_columns.py --db data\\labelled.db   # a specific DB only

Take a backup first if you want belt-and-suspenders safety:
    Copy-Item data\\labelled.db data\\labelled.db.bak
"""

import argparse
import os
import sqlite3
import sys

TABLE = "opg_well_telemetry"

# (column_name, column_definition) — mirrors the CREATE TABLE + dynamic list in
# backend/database.py. DEFAULT NULL keeps existing rows untouched.
NATIVE_VFD_COLUMNS = [
    ("discharge_pressure_psi", "REAL DEFAULT NULL"),   # Disch pr. Bar/psi
    ("intake_temperature_c",   "REAL DEFAULT NULL"),   # Int temp °C
    ("motor_temperature_c",    "REAL DEFAULT NULL"),   # Motor temp °C
    ("whp_psi",                "REAL DEFAULT NULL"),   # WHP (PSI)
    ("flp_psi",                "REAL DEFAULT NULL"),   # FLP (PSI)
    ("annulus_pressure_psi",   "REAL DEFAULT NULL"),   # AP (PSI)
    ("leak_current_ct",        "REAL DEFAULT NULL"),   # Leak Current Ct
    ("dhg_current",            "REAL DEFAULT NULL"),   # DHG Current
    ("vfd_status",             "INTEGER DEFAULT NULL"),  # VFD STS (1=Running, 0=Stopped)
]

# Default targets, relative to the cced_esp project root (script's parent's parent).
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DBS = [
    os.path.join(_PROJECT_ROOT, "data", "labelled.db"),
    os.path.join(_PROJECT_ROOT, "data", "unlabelled.db"),
]


def _table_exists(cur: sqlite3.Cursor) -> bool:
    row = cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (TABLE,)
    ).fetchone()
    return row is not None


def _existing_columns(cur: sqlite3.Cursor) -> set:
    return {r[1] for r in cur.execute(f"PRAGMA table_info({TABLE})").fetchall()}


def migrate_db(db_path: str, dry_run: bool) -> bool:
    """Migrate a single DB. Returns True on success (or clean no-op), False on error."""
    if not os.path.exists(db_path):
        print(f"[SKIP] {db_path} — file not found")
        return True

    print(f"\n=== {db_path} ===")
    try:
        conn = sqlite3.connect(db_path, timeout=30.0)
    except Exception as ex:
        print(f"[ERROR] could not open ({ex})")
        return False

    try:
        cur = conn.cursor()
        if not _table_exists(cur):
            print(f"[SKIP] table '{TABLE}' does not exist in this DB")
            return True

        existing = _existing_columns(cur)
        to_add = [(n, d) for (n, d) in NATIVE_VFD_COLUMNS if n not in existing]

        if not to_add:
            print(f"[OK] all {len(NATIVE_VFD_COLUMNS)} native VFD columns already present — no change")
            return True

        print(f"[{'DRY-RUN' if dry_run else 'MIGRATE'}] {len(to_add)} column(s) to add:")
        for name, col_def in to_add:
            print(f"    + {name} {col_def}")
            if not dry_run:
                # ADD COLUMN is metadata-only in SQLite — existing rows are untouched.
                cur.execute(f"ALTER TABLE {TABLE} ADD COLUMN {name} {col_def};")

        if not dry_run:
            conn.commit()
            after = _existing_columns(cur)
            still_missing = [n for (n, _) in NATIVE_VFD_COLUMNS if n not in after]
            if still_missing:
                print(f"[WARN] still missing after migrate: {still_missing}")
                return False
            print(f"[DONE] committed — table now has all {len(NATIVE_VFD_COLUMNS)} native VFD columns")
        return True
    except Exception as ex:
        print(f"[ERROR] migration failed ({ex}) — rolling back")
        try:
            conn.rollback()
        except Exception:
            pass
        return False
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Add native VFD columns (idempotent, non-destructive).")
    parser.add_argument("--db", action="append", help="Specific DB path (repeatable). Defaults to labelled.db + unlabelled.db.")
    parser.add_argument("--dry-run", action="store_true", help="Show planned changes without writing.")
    args = parser.parse_args()

    targets = args.db if args.db else DEFAULT_DBS
    print(f"Native VFD column migration — {'DRY RUN (no writes)' if args.dry_run else 'LIVE'}")
    print(f"Targets: {targets}")

    ok = True
    for db_path in targets:
        ok = migrate_db(db_path, args.dry_run) and ok

    print("\n" + ("All targets OK." if ok else "One or more targets had errors — review output above."))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
