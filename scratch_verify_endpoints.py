import urllib.request
import json
import sys

endpoints = [
    "/api/esp/assets",
    "/api/esp/faults/registry",
    "/api/esp/assets/FS-010/pump-curve-data",
    "/api/esp/assets/FS-010/health-index",
    "/api/esp/assets/FS-010/vsd-advisor",
    "/api/esp/fleet/profitability?time_filter=24h",
    "/api/database/browse?db_name=unlabelled&limit=5",
    "/api/database/browse?db_name=labelled&limit=5",
    "/api/database/stats",
    "/api/mqtt/status"
]

print("=== VERIFYING ESP SCADA BACKEND APIS ===", flush=True)
for ep in endpoints:
    url = f"http://127.0.0.1:8000{ep}"
    try:
        req = urllib.request.urlopen(url, timeout=5)
        status = req.getcode()
        body = req.read().decode("utf-8")
        data = json.loads(body)
        keys_summary = list(data.keys())[:4]
        print(f"[OK] [{status}] {ep} -> {data.get('status', 'SUCCESS')} (keys: {keys_summary})", flush=True)
    except Exception as e:
        print(f"[FAIL] {ep} -> {e}", flush=True)

print("=== ALL VERIFICATION CHECKS COMPLETED ===", flush=True)
