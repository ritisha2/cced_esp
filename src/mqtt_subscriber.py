"""
Real-Time MQTT Subscriber & Live Detection Engine.
Subscribes to live ESP field telemetry, executes real-time 2-tier fault classification
and anomaly detection inference, and publishes predictions to the MQTT broker.

Environment Configuration:
- MQTT_BROKER_HOST: Broker address (default: 192.168.1.155)
- MQTT_PORT: Broker port (default: 1883)
- MQTT_TOPIC_SUB: Ingestion subscription topic (default: esp/v1/+/telemetry)
- MQTT_TOPIC_PUB: Prediction publishing topic (default: esp/v1/predictions)
- MQTT_USERNAME: Optional authentication username
- MQTT_PASSWORD: Optional authentication password
"""

import os
import sys
import json
import time
import signal
from pathlib import Path
from typing import Dict, Any, Optional

import paho.mqtt.client as mqtt

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.inference_engine import ESPInferenceEngine

# Environment Variables
BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "192.168.1.155")
BROKER_PORT = int(os.getenv("MQTT_PORT", "1883"))
TOPIC_SUB = os.getenv("MQTT_TOPIC_SUB", "esp/v1/+/telemetry")
TOPIC_PUB = os.getenv("MQTT_TOPIC_PUB", "esp/v1/predictions")
MQTT_USER = os.getenv("MQTT_USERNAME", None)
MQTT_PASS = os.getenv("MQTT_PASSWORD", None)

# ANSI Color Codes for Terminal Card Formatting
C_CYAN = "\033[96m"
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_MAGENTA = "\033[95m"
C_BOLD = "\033[1m"
C_DIM = "\033[2m"
C_RESET = "\033[0m"


class RealTimeMQTTSubscriber:
    """Production MQTT Real-Time Detection Node."""

    def __init__(
        self,
        broker_host: str = BROKER_HOST,
        broker_port: int = BROKER_PORT,
        topic_sub: str = TOPIC_SUB,
        topic_pub: str = TOPIC_PUB
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.topic_sub = topic_sub
        self.topic_pub = topic_pub
        self.running = False
        self.total_processed = 0
        self.total_faults = 0
        self.total_anomalies = 0

        print(f"[*] Initializing Two-Tier ESP Inference Engine...")
        self.engine = ESPInferenceEngine()

        client_id = f"esp_detection_node_{int(time.time())}"
        try:
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
        except AttributeError:
            self.client = mqtt.Client(client_id=client_id)

        if MQTT_USER and MQTT_PASS:
            self.client.username_pw_set(MQTT_USER, MQTT_PASS)

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            print(f"{C_GREEN}[OK] CONNECTED to MQTT Broker {self.broker_host}:{self.broker_port}{C_RESET}")
            client.subscribe(self.topic_sub)
            print(f"{C_CYAN}[*] Subscribed to Ingestion Topic: {self.topic_sub}{C_RESET}")
            print(f"{C_CYAN}[*] Publishing Predictions to:     {self.topic_pub}{C_RESET}")
            print(f"{C_DIM}Listening for incoming field packets... Press Ctrl+C to stop.{C_RESET}\n")
        else:
            print(f"{C_RED}[!] Connection failed with error code: {rc}{C_RESET}")

    def _on_disconnect(self, client, userdata, flags_or_rc, rc_or_props=None, properties=None):
        print(f"{C_YELLOW}[!] Disconnected from MQTT broker.{C_RESET}")

    def _on_message(self, client, userdata, msg):
        """Process incoming field telemetry and publish detection output."""
        try:
            payload_str = msg.payload.decode("utf-8", errors="ignore")
            payload_data = json.loads(payload_str)
        except Exception:
            return

        self.total_processed += 1
        
        # Flatten measurements if wrapped in nested dictionary
        flat_telemetry = {}
        if "measurements" in payload_data and isinstance(payload_data["measurements"], dict):
            flat_telemetry.update(payload_data["measurements"])
        flat_telemetry.update(payload_data)

        # Run Two-Tier Inference
        prediction = self.engine.predict(flat_telemetry)
        
        # Add tracking metadata
        well_id = payload_data.get("well_id", payload_data.get("asset_id", "UNKNOWN"))
        prediction["well_id"] = well_id

        if prediction["state"] == "FAULT":
            self.total_faults += 1
        if prediction["is_anomaly"]:
            self.total_anomalies += 1

        # Publish Detection Output to MQTT
        try:
            pub_payload = json.dumps(prediction)
            client.publish(self.topic_pub, pub_payload, qos=0)
        except Exception as e:
            print(f"{C_RED}[!] Failed to publish prediction: {e}{C_RESET}")

        # Render Formatted SCADA Card to Terminal
        self._render_terminal_card(well_id, msg.topic, prediction)

    def _render_terminal_card(self, well_id: str, topic: str, pred: Dict[str, Any]):
        """Render multi-line SCADA diagnostic card to terminal."""
        ts_str = time.strftime("%H:%M:%S", time.localtime(pred["timestamp"]))
        state = pred["state"]
        state_color = C_GREEN if state == "HEALTHY" else C_RED
        fault_name = pred["fault_classification"]
        conf = pred["confidence_score"]
        anom_score = pred["anomaly_score"]
        is_anom = pred["is_anomaly"]
        anom_badge = f"{C_RED}ANOMALY (Score: {anom_score:.3f}){C_RESET}" if is_anom else f"{C_GREEN}NORMAL (Score: {anom_score:.3f}){C_RESET}"

        tel = pred["telemetry_received"]
        p_wh = tel.get("R_PIT_001", 0.0)
        p_pip = tel.get("R_INTAKE_PRESS", 0.0)
        p_pdp = tel.get("R_DISCH_PRESS", 0.0)
        t_pip = tel.get("R_INTAKE_TEMP", 0.0)
        t_mot = tel.get("R_MOTOR_TEMP", 0.0)
        freq = tel.get("R_FREQUENCY", 0.0)
        vib = tel.get("R_VIBRATION_X", 0.0)
        i_drv = tel.get("R_DRV_CURR_AVG", 0.0)
        v_bus = tel.get("R_BUS_IN_VTG_AVG", 0.0)

        vib_color = C_RED if vib > 0.30 else (C_YELLOW if vib > 0.20 else C_GREEN)
        temp_color = C_RED if t_mot > 100.0 else (C_YELLOW if t_mot > 90.0 else C_GREEN)
        volt_color = C_RED if v_bus < 400.0 or v_bus > 500.0 else C_GREEN

        print(f"{C_DIM}[{ts_str}] #{self.total_processed:<5}{C_RESET} {C_CYAN}TOPIC: {topic}{C_RESET}")
        print(f"  {C_BOLD}Well/Asset:{C_RESET} {well_id:<12} {C_BOLD}State:{C_RESET} {state_color}{state:<9}{C_RESET} {C_BOLD}Classification:{C_RESET} {C_MAGENTA}{fault_name}{C_RESET} (Conf: {conf*100:.1f}%)")
        print(f"  {C_BOLD}Anomaly Status:{C_RESET} {anom_badge}")
        print(f"  {C_DIM}Flow/WH P:{C_RESET} {p_wh:>6.1f} Barg  {C_DIM}Intake P:{C_RESET} {p_pip:>7.1f} psi   {C_DIM}Discharge P:{C_RESET} {p_pdp:>7.1f} psi")
        print(f"  {C_DIM}Freq:{C_RESET}      {freq:>6.1f} Hz    {C_DIM}Current:{C_RESET}  {i_drv:>7.1f} A     {C_DIM}Voltage:{C_RESET}     {volt_color}{v_bus:>7.1f} V{C_RESET}")
        print(f"  {C_DIM}Motor T:{C_RESET}   {temp_color}{t_mot:>6.1f} °C{C_RESET}   {C_DIM}Intake T:{C_RESET} {t_pip:>7.1f} °C   {C_DIM}Vibration:{C_RESET}   {vib_color}{vib:>7.3f} g{C_RESET}")

        if pred["triggered_limits"]:
            print(f"  {C_RED}{C_BOLD}Triggered Limits:{C_RESET}")
            for lim in pred["triggered_limits"]:
                print(f"    * {lim['tag']}: {lim['value']} (Limit: {lim['limit']} | Type: {lim['type']})")
        print(f"{C_DIM}{'-' * 80}{C_RESET}\n")

    def run(self):
        """Start the live MQTT loop."""
        self.running = True
        print(f"[*] Connecting to {self.broker_host}:{self.broker_port}...")
        try:
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_forever()
        except KeyboardInterrupt:
            print("\n[*] Stopping MQTT detection node gracefully...")
        finally:
            self.stop()

    def stop(self):
        """Clean disconnect."""
        self.running = False
        try:
            self.client.disconnect()
            self.client.loop_stop()
        except Exception:
            pass
        print(f"[*] Node stopped. Total Packets: {self.total_processed} | Faults: {self.total_faults} | Anomalies: {self.total_anomalies}")


if __name__ == "__main__":
    node = RealTimeMQTTSubscriber()
    node.run()
