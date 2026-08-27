/**
 * 13 Canonical ESP Telemetry Field Tags & Physical Limits.
 */

export const PARAM_CONFIGS = [
  {
    tag: "R_PIT_001",
    name: "Wellhead Pressure",
    shortName: "WHP",
    unit: "Barg",
    color: "#00e5ff", // Cyan
    min: 0,
    max: 150,
    normalMin: 50.0,
    normalMax: 120.0,
    decimals: 1,
    category: "Hydraulic"
  },
  {
    tag: "R_PIT_002",
    name: "Casing / Annulus Pressure",
    shortName: "Annulus P",
    unit: "Barg",
    color: "#3b82f6", // Blue
    min: 0,
    max: 130,
    normalMin: 30.0,
    normalMax: 100.0,
    decimals: 1,
    category: "Hydraulic"
  },
  {
    tag: "R_PIT_003",
    name: "Flowline Pressure",
    shortName: "Flowline P",
    unit: "Barg",
    color: "#6366f1", // Indigo
    min: 0,
    max: 130,
    normalMin: 30.0,
    normalMax: 100.0,
    decimals: 1,
    category: "Hydraulic"
  },
  {
    tag: "R_INTAKE_PRESS",
    name: "Intake Pressure (PIP)",
    shortName: "PIP",
    unit: "psi",
    color: "#10b981", // Emerald
    min: 0,
    max: 2500,
    normalMin: 800.0,
    normalMax: 2000.0,
    decimals: 1,
    category: "Hydraulic"
  },
  {
    tag: "R_INTAKE_TEMP",
    name: "Intake Temperature",
    shortName: "Intake Temp",
    unit: "°C",
    color: "#84cc16", // Lime
    min: 20,
    max: 120,
    normalMin: 50.0,
    normalMax: 90.0,
    decimals: 1,
    category: "Thermal"
  },
  {
    tag: "R_DISCH_PRESS",
    name: "Discharge Pressure (PDP)",
    shortName: "PDP",
    unit: "psi",
    color: "#14b8a6", // Teal
    min: 500,
    max: 3500,
    normalMin: 1500.0,
    normalMax: 3000.0,
    decimals: 1,
    category: "Hydraulic"
  },
  {
    tag: "R_MOTOR_TEMP",
    name: "Motor Winding Temperature",
    shortName: "Motor Temp",
    unit: "°C",
    color: "#f59e0b", // Amber
    min: 20,
    max: 150,
    normalMin: 60.0,
    normalMax: 100.0,
    decimals: 1,
    category: "Thermal"
  },
  {
    tag: "R_FREQUENCY",
    name: "Drive Frequency",
    shortName: "Frequency",
    unit: "Hz",
    color: "#8b5cf6", // Purple
    min: 0,
    max: 70,
    normalMin: 40.0,
    normalMax: 60.0,
    decimals: 1,
    category: "Electrical"
  },
  {
    tag: "R_VIBRATION_X",
    name: "Vibration RMS (X-Axis)",
    shortName: "Vibration",
    unit: "g",
    color: "#ef4444", // Red
    min: 0,
    max: 1.0,
    normalMin: 0.05,
    normalMax: 0.30,
    decimals: 3,
    category: "Mechanical"
  },
  {
    tag: "R_TOOL_CURRENT",
    name: "Tool / Leakage Current",
    shortName: "Tool Current",
    unit: "mA",
    color: "#ec4899", // Pink
    min: 0,
    max: 30,
    normalMin: 0.0,
    normalMax: 20.0,
    decimals: 1,
    category: "Electrical"
  },
  {
    tag: "R_DRV_CURR_AVG",
    name: "Drive Current (Average)",
    shortName: "Drive Current",
    unit: "A",
    color: "#f97316", // Orange
    min: 0,
    max: 120,
    normalMin: 30.0,
    normalMax: 90.0,
    decimals: 1,
    category: "Electrical"
  },
  {
    tag: "R_DHG_CURR_AVG",
    name: "Downhole Gauge Current",
    shortName: "DHG Current",
    unit: "A",
    color: "#eab308", // Yellow
    min: 0,
    max: 120,
    normalMin: 30.0,
    normalMax: 90.0,
    decimals: 1,
    category: "Electrical"
  },
  {
    tag: "R_BUS_IN_VTG_AVG",
    name: "Input Bus Voltage",
    shortName: "Bus Voltage",
    unit: "V",
    color: "#06b6d4", // Sky Blue
    min: 200,
    max: 600,
    normalMin: 400.0,
    normalMax: 500.0,
    decimals: 1,
    category: "Electrical"
  }
];

export const TAG_MAP = Object.fromEntries(PARAM_CONFIGS.map(c => [c.tag, c]));
