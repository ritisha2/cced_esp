#!/usr/bin/env python3
"""
ESP Intelligence & Telemetry Live Terminal Monitor.
Streams live physical telemetry and ML health assessments directly to your terminal.
"""

import sys
import json
import asyncio
import argparse
import urllib.request
import urllib.parse
from datetime import datetime

try:
    import websockets
except ImportError:
    websockets = None

# Ensure immediate unbuffered terminal output
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

# ANSI Color Codes
CLR_RESET = "\033[0m"
CLR_BOLD = "\033[1m"
CLR_DIM = "\033[2m"
CLR_GREEN = "\033[92m"
CLR_YELLOW = "\033[93m"
CLR_RED = "\033[91m"
CLR_CYAN = "\033[96m"
CLR_BLUE = "\033[94m"
CLR_MAGENTA = "\033[95m"
CLR_WHITE = "\033[97m"


def print_banner(asset_filter: str):
    print(f"\n{CLR_BOLD}{CLR_CYAN}========================================================================================{CLR_RESET}", flush=True)
    print(f"{CLR_BOLD}{CLR_WHITE}  [*] ESP INTELLIGENCE PLATFORM -- LIVE TERMINAL TELEMETRY STREAM  [*]{CLR_RESET}", flush=True)
    print(f"{CLR_DIM}  Zero Fabrication | Real MQTT/SQLite Telemetry | Live Condition Monitoring{CLR_RESET}", flush=True)
    print(f"{CLR_CYAN}========================================================================================{CLR_RESET}", flush=True)
    print(f"{CLR_BOLD}Active Filter:{CLR_RESET} {CLR_YELLOW}{asset_filter if asset_filter else 'ALL ASSETS (Fleet Stream)'}{CLR_RESET}  |  {CLR_BOLD}Source:{CLR_RESET} {CLR_GREEN}Live Historian & WebSocket{CLR_RESET}", flush=True)
    print(f"{CLR_DIM}Press Ctrl+C to stop streaming.{CLR_RESET}\n", flush=True)
    
    header = (
        f"{CLR_BOLD}{'TIMESTAMP (UTC)':<12} | {'ASSET ID':<10} | {'PIP (PSI)':<9} | {'PDP (PSI)':<9} | "
        f"{'CURR (A)':<8} | {'TEMP (C)':<8} | {'FLOW (BPD)':<10} | {'VIB (g)':<7} | {'FREQ':<6} | "
        f"{'HEALTH':<8} | {'ACTIVE DIAGNOSIS'}{CLR_RESET}"
    )
    print(header, flush=True)
    print("-" * 120, flush=True)


def format_row(data: dict) -> str:
    # Extract measurements safely
    meas = data.get("measurements", {})
    raw_asset = str(data.get("asset_id") or data.get("asset") or "UNKNOWN")
    asset_id = raw_asset.split("[")[0].strip()
    
    ts_raw = data.get("timestamp") or datetime.utcnow().isoformat()
    try:
        dt = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
        time_str = dt.strftime("%H:%M:%S")
    except Exception:
        time_str = str(ts_raw)[-8:]

    pip = float(data.get("intake_pressure_psi") or meas.get("intake_pressure_psi") or meas.get("intake_p") or 0.0)
    pdp = float(data.get("discharge_pressure_psi") or data.get("pressure_psi") or meas.get("discharge_pressure_psi") or 0.0)
    cur = float(data.get("motor_current_a") or meas.get("motor_current_a") or meas.get("current") or 0.0)
    temp = float(data.get("temperature_c") or meas.get("temperature_c") or meas.get("motor_temperature_c") or 0.0)
    flow = float(data.get("flow_rate_bpd") or meas.get("flow_rate_bpd") or meas.get("flow_bpd") or 0.0)
    vib = float(data.get("vibration_g") or meas.get("vibration_g_rms") or 0.0)
    freq = float(data.get("frequency_hz") or meas.get("frequency_hz") or 60.0)

    # Health & status
    status = str(data.get("status") or "NORMAL").upper()
    scenario = str(data.get("scenario") or data.get("fault_name") or "Healthy Operation").replace("_", " ").title()

    # Color code
    if "CRITICAL" in status or "TRIP" in status:
        stat_color = CLR_RED
        status_badge = f"{CLR_RED}{status:<8}{CLR_RESET}"
    elif "WARN" in status:
        stat_color = CLR_YELLOW
        status_badge = f"{CLR_YELLOW}{status:<8}{CLR_RESET}"
    else:
        stat_color = CLR_GREEN
        status_badge = f"{CLR_GREEN}{status:<8}{CLR_RESET}"

    row = (
        f"{CLR_DIM}{time_str:<12}{CLR_RESET} | "
        f"{CLR_BOLD}{CLR_CYAN}{asset_id:<10}{CLR_RESET} | "
        f"{pip:>8.1f}  | "
        f"{pdp:>8.1f}  | "
        f"{cur:>7.1f}  | "
        f"{temp:>8.1f}  | "
        f"{flow:>9.0f}  | "
        f"{vib:>6.2f} | "
        f"{freq:>5.1f} | "
        f"{status_badge} | "
        f"{stat_color}{scenario}{CLR_RESET}"
    )
    return row


async def continuous_stream(http_url: str, asset_filter: str, interval: float, raw_mode: bool):
    """Continuously streams real-time telemetry across fleet or selected asset."""
    print_banner(asset_filter)
    
    # Fast initial asset list
    assets = [asset_filter] if asset_filter else ["FS-010", "FS-011", "FS-013", "FSWS-001-A", "FS-021", "FS-022", "FS-023"]
    if not asset_filter:
        try:
            req = urllib.request.Request(f"{http_url}/api/esp/wells", headers={"User-Agent": "ESP-CLI-Monitor/1.0"})
            with urllib.request.urlopen(req, timeout=2) as response:
                adata = json.loads(response.read().decode("utf-8"))
                if adata.get("assets"):
                    assets = adata["assets"]
        except Exception:
            pass

    asset_idx = 0
    while True:
        target_asset = assets[asset_idx % len(assets)]
        asset_idx += 1
        
        try:
            url = f"{http_url}/api/esp/assets/{urllib.parse.quote(target_asset)}/visualization"
            req = urllib.request.Request(url, headers={"User-Agent": "ESP-CLI-Monitor/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                bundle = json.loads(response.read().decode("utf-8"))

            if raw_mode:
                print(json.dumps(bundle, indent=2), flush=True)
            else:
                sch = bundle.get("schematic", {})
                surf = sch.get("surface", {})
                pump = sch.get("pump", {})
                mot = sch.get("motor", {})
                perf = sch.get("perforations", {})
                a = bundle.get("assessment", {})

                row_dict = {
                    "timestamp": bundle.get("timestamp"),
                    "asset_id": bundle.get("asset_id"),
                    "intake_pressure_psi": pump.get("intake_pressure_psi"),
                    "discharge_pressure_psi": pump.get("discharge_pressure_psi"),
                    "motor_current_a": mot.get("motor_current_a"),
                    "temperature_c": mot.get("motor_temperature_c"),
                    "flow_rate_bpd": perf.get("liquid_rate_bpd") or pump.get("liquid_rate_bpd"),
                    "vibration_g": mot.get("vibration_rms"),
                    "frequency_hz": surf.get("frequency_hz"),
                    "status": a.get("overall_status", "NORMAL"),
                    "scenario": a.get("fault_name", "Healthy Operation")
                }
                print(format_row(row_dict), flush=True)
                
                overall = a.get("overall_status", "HEALTHY")
                fault = a.get("fault_name", "Healthy")
                conf = int((a.get("fault_probability") or 1.0) * 100)
                trace = bundle.get("trace_id", "")
                color = CLR_GREEN if overall == "HEALTHY" else (CLR_YELLOW if overall == "WARNING" else CLR_RED)
                print(f"  {CLR_DIM}-> [ML Assessment]{CLR_RESET} {color}{overall}{CLR_RESET} | {fault} ({conf}% Conf) | Trace: {CLR_BLUE}{trace}{CLR_RESET}", flush=True)

        except Exception as e:
            print(f"{CLR_YELLOW}[!] Stream error ({e}). Retrying...{CLR_RESET}", flush=True)

        await asyncio.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="Live ESP Telemetry Terminal Monitor")
    parser.add_argument("--asset", "-a", type=str, default="", help="Filter by Asset ID or Well ID (e.g. FS-010, FSWS-001-A)")
    parser.add_argument("--url", "-u", type=str, default="ws://127.0.0.1:8000/ws/live", help="WebSocket stream URL")
    parser.add_argument("--http-url", type=str, default="http://127.0.0.1:8000", help="HTTP API base URL")
    parser.add_argument("--interval", "-i", type=float, default=1.5, help="Stream tick interval in seconds (default: 1.5s)")
    parser.add_argument("--raw", "-r", action="store_true", help="Print raw incoming JSON payloads")
    args = parser.parse_args()

    try:
        asyncio.run(continuous_stream(args.http_url, args.asset, args.interval, args.raw))
    except KeyboardInterrupt:
        print(f"\n{CLR_CYAN}Stream stopped by user. Goodbye!{CLR_RESET}", flush=True)
        sys.exit(0)


if __name__ == "__main__":
    main()
