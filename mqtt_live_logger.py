#!/usr/bin/env python3
"""
Live MQTT Broker Terminal Logger (Exact SCADA Card Layout).
Subscribes to 192.168.1.155:1883 and streams formatted cards in real-time.
"""

import sys
import json
import time
import argparse
from datetime import datetime

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("[ERROR] paho-mqtt is required. Run: pip install paho-mqtt")
    sys.exit(1)

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
CLR_WHITE = "\033[97m"

msg_counter = 0


def format_card(msg_index: int, topic: str, data: dict, raw_payload: str) -> str:
    now_str = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    
    if not isinstance(data, dict):
        return f"\n{CLR_CYAN}[{now_str}] #{msg_index:>5}  TOPIC: {topic}{CLR_RESET}\n  {raw_payload}\n"

    well_id = str(data.get("well_id") or data.get("asset_id") or "UNKNOWN")
    scenario = str(data.get("scenario") or data.get("fault_name") or "normal")
    state = str(data.get("operating_state") or data.get("status") or "running")

    # State color
    state_color = CLR_GREEN if "run" in state.lower() else (CLR_RED if "trip" in state.lower() or "stop" in state.lower() else CLR_YELLOW)
    scenario_color = CLR_YELLOW if scenario != "normal" else CLR_YELLOW

    meas = data.get("measurements", {})
    flow = float(meas.get("flow_bpd") or meas.get("flow_rate_bpd") or data.get("flow_rate_bpd") or 0.0)
    intake_p = float(meas.get("intake_pressure_psi") or meas.get("intake_p") or data.get("intake_pressure_psi") or 0.0)
    discharge_p = float(meas.get("discharge_pressure_psi") or meas.get("pressure_psi") or data.get("discharge_pressure_psi") or 0.0)
    freq = float(meas.get("frequency_hz") or data.get("frequency_hz") or 0.0)
    current = float(meas.get("motor_current_a") or meas.get("current") or data.get("motor_current_a") or 0.0)
    voltage = float(meas.get("motor_voltage_v") or meas.get("voltage") or data.get("motor_voltage_v") or 0.0)
    temp = float(meas.get("motor_temperature_c") or meas.get("temperature_c") or data.get("temperature_c") or 0.0)
    vib = float(meas.get("vibration_g_rms") or meas.get("vibration_g") or data.get("vibration_g") or 0.0)
    v_imb = float(meas.get("voltage_imbalance_pct") or 0.0)
    i_imb = float(meas.get("current_imbalance_pct") or 0.0)

    # Clean multi-line card layout matching screenshot
    lines = [
        f"{CLR_RESET}----------------------------------------------------------------------------------------------------",
        f"{CLR_CYAN}[{now_str}] # {msg_index:<5}  TOPIC: {topic}{CLR_RESET}",
        f"  Well: {CLR_BOLD}{CLR_WHITE}{well_id:<12}{CLR_RESET}      Scenario: {scenario_color}{scenario:<16}{CLR_RESET}   State: {state_color}{state}{CLR_RESET}",
        f"",
        f"  Flow:    {flow:>7.1f} BPD    Intake P:    {intake_p:>7.1f} psi     Discharge P:  {discharge_p:>7.1f} psi",
        f"  Freq:    {freq:>7.2f} Hz     Current:     {current:>7.2f} A       Voltage:      {voltage:>7.1f} V",
        f"  Temp:    {temp:>7.2f} C      Vibration:   {vib:>7.4f} g      V-Imb: {v_imb:>4.2f}%  I-Imb: {i_imb:>4.2f}%"
    ]
    return "\n".join(lines)


def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        topic = userdata['topic']
        print(f"\n{CLR_BOLD}{CLR_CYAN}========================================================================================{CLR_RESET}", flush=True)
        print(f"{CLR_BOLD}{CLR_WHITE}  [*] MQTT LIVE STREAMER -- CONNECTED TO {userdata['host']}:{userdata['port']}{CLR_RESET}", flush=True)
        print(f"{CLR_CYAN}========================================================================================{CLR_RESET}", flush=True)
        print(f"{CLR_GREEN}Subscribed to: {topic}{CLR_RESET}  |  {CLR_DIM}Waiting for telemetry packets (Ctrl+C to exit)...{CLR_RESET}\n", flush=True)
        client.subscribe(topic)
    else:
        print(f"{CLR_BOLD}{CLR_RED}[CONNECTION FAILED]{CLR_RESET} Return code: {rc}", flush=True)


def on_disconnect(client, userdata, rc, properties=None):
    print(f"\n{CLR_YELLOW}[DISCONNECTED]{CLR_RESET} Disconnected from broker (rc={rc}). Reconnecting...", flush=True)


def on_message(client, userdata, msg):
    global msg_counter
    msg_counter += 1
    
    topic = msg.topic
    payload_raw = msg.payload
    
    try:
        payload_str = payload_raw.decode("utf-8")
        try:
            data = json.loads(payload_str)
        except Exception:
            data = {}
        
        if userdata.get("raw"):
            print(f"\n{CLR_CYAN}[{datetime.now().strftime('%H:%M:%S')}] #{msg_counter} TOPIC: {topic}{CLR_RESET}", flush=True)
            try:
                print(json.dumps(data, indent=2), flush=True)
            except Exception:
                print(payload_str, flush=True)
        else:
            card = format_card(msg_counter, topic, data, payload_str)
            print(card, flush=True)
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {topic}: Error decoding: {e}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Live MQTT Broker Terminal Streamer")
    parser.add_argument("--host", "-H", type=str, default="192.168.1.155", help="MQTT Broker IP address (default: 192.168.1.155)")
    parser.add_argument("--port", "-p", type=int, default=1883, help="MQTT Broker Port (default: 1883)")
    parser.add_argument("--topic", "-t", type=str, default="esp/v1/+/telemetry", help="MQTT Topic to subscribe to (default: esp/v1/+/telemetry)")
    parser.add_argument("--raw", action="store_true", help="Print verbatim raw JSON payload directly as received")
    parser.add_argument("--username", "-u", type=str, default=None, help="MQTT Username (optional)")
    parser.add_argument("--password", "-P", type=str, default=None, help="MQTT Password (optional)")
    args = parser.parse_args()

    userdata = {
        "host": args.host,
        "port": args.port,
        "topic": args.topic,
        "raw": args.raw
    }

    client_id = f"esp_card_logger_{int(time.time())}"
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id, userdata=userdata)
    except AttributeError:
        client = mqtt.Client(client_id=client_id, userdata=userdata)

    if args.username and args.password:
        client.username_pw_set(args.username, args.password)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    try:
        client.connect(args.host, args.port, keepalive=60)
        client.loop_forever()
    except KeyboardInterrupt:
        print(f"\n{CLR_CYAN}Stream stopped by user. Goodbye!{CLR_RESET}", flush=True)
        try:
            client.disconnect()
        except Exception:
            pass
        sys.exit(0)
    except Exception as e:
        print(f"\n{CLR_RED}[ERROR]{CLR_RESET} Could not connect to {args.host}:{args.port} -> {e}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
