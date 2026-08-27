You are working on an existing ESP monitoring application.

I need you to redesign/restructure the FRONTEND into a **single vertically scrollable React page** based on the attached/reference screenshots.

IMPORTANT: **Do NOT rebuild the application from scratch. Do NOT replace the existing backend. Do NOT remove or bypass existing backend functionality. Do NOT hardcode live values.**

The existing backend and its APIs/data flow are already implemented and must remain the source of truth.

## 1. PRIMARY OBJECTIVE

Create one polished, production-quality, vertically scrollable ESP monitoring dashboard in React.

The page should combine the functionality shown across the reference screenshots into one coherent page.

The user should be able to scroll from top to bottom through sections such as:

1. Header / navigation
2. System summary cards
3. MQTT / ingestion controls
4. Live data table
5. Active fault / diagnosis banner
6. ESP system / well visualization
7. Operating envelope / monitored parameters
8. Synchronized time-series charts
9. Detailed parameter charts
10. Historical scenario / replay controls
11. Well / asset health overview
12. Asset cards / fleet overview
13. Export / database controls
14. Connection / ingestion / stream status

Do not simply stack screenshots vertically. Recreate the UI as a properly designed responsive React application.

---

# 2. VERY IMPORTANT: BACKEND MUST REMAIN UNTOUCHED

Before changing the frontend:

### First inspect the existing project

Understand:

- React structure
- routing
- components
- hooks
- API services
- backend endpoints
- WebSocket connections
- MQTT integration
- state management
- data models/types/interfaces
- existing charts
- existing filtering
- existing fault/diagnosis logic
- existing historical replay logic
- existing export functionality
- existing database operations

Find exactly where the current frontend gets its data.

Do NOT invent a new backend contract when an existing one already exists.

Do NOT rename or remove backend APIs.

Do NOT change backend business logic unless absolutely required for compatibility, and ask before making backend changes.

The frontend must continue consuming the existing backend exactly as it currently does.

---

# 3. ZERO HARDCODING

This is extremely important.

**Do not hardcode application data into the React components.**

Do NOT hardcode:

- well names
- asset IDs
- ESP IDs
- pressure values
- current values
- temperature values
- flow values
- frequency values
- fault names
- alarm states
- telemetry values
- chart data
- number of wells
- number of records
- ingestion rate
- MQTT state
- stream state
- timestamps
- diagnosis
- anomaly scores
- confidence values
- operating envelope values
- asset health
- status badges
- historical records

All of these must come from the existing backend.

Example:

BAD:

```js
const wells = ["FS-010", "FS-011", "FS-012"];
```

GOOD:

```js
const { wells } = useWells();
```

or use whatever existing service/hook/API already exists in this project.

If the backend returns 5 wells, display 5.

If it returns 50 wells, display 50.

If the backend changes the values, the UI should update automatically.

---

# 4. LIVE DATA MAPPING

Map the UI directly to the real backend data.

Every important UI element should have a real data source.

Create a clear mapping internally such as:

UI ELEMENT → EXISTING API / STATE / STREAM → FIELD

For example:

- Ingestion Rate → existing ingestion endpoint/state → actual ingestion rate field
- Active Wells → existing fleet/well data → actual count
- MQTT status → existing MQTT/WebSocket connection state
- Live records → existing telemetry stream
- Asset status → existing asset state
- Fault → existing fault/diagnosis field
- Pressure → existing pressure telemetry fields
- Motor current → existing current field
- Motor temperature → existing temperature field
- Frequency → existing VSD frequency field
- Flow → existing flow field
- Charts → actual historical/time-series data from backend
- Asset cards → actual well/asset records
- Historical replay → existing historical scenario data
- Export buttons → existing export functionality

Do not create a fake frontend data layer just to make the screen look populated.

---

# 5. REAL-TIME BEHAVIOR

Where the existing application already supports live updates, preserve that mechanism.

If the current application uses:

- WebSockets
- MQTT
- polling
- server-sent events
- React Query
- Zustand
- Redux
- custom event streams

continue using the existing mechanism.

Do not replace a functioning real-time architecture with mock timers.

The following should update from real data:

- telemetry cards
- ingestion statistics
- live table
- connection status
- fault status
- asset status
- charts
- well health
- operating envelope
- anomaly indicators

When the backend has no data, display a proper empty/loading/unavailable state instead of fake values.

---

# 6. VISUAL DESIGN — FOLLOW THE REFERENCE IMAGES

The reference screenshots are the source of truth for visual design.

Use the same overall visual language.

## Theme

Primary application feel:

**Industrial / Oil & Gas / ESP Control Room / Engineering Monitoring**

Use:

- deep navy
- near-black
- blue-black panels
- dark technical surfaces
- subtle blue-gray borders

Avoid:

- generic SaaS dashboard styling
- bright gradients
- excessive glassmorphism
- overly rounded "modern startup" cards
- playful illustrations
- unnecessary animation

The UI should feel like a serious industrial monitoring system.

---

# 7. COLOR SYSTEM

Use semantic colors consistently.

### Primary

Cyan / electric blue

Used for:

- active controls
- telemetry lines
- primary actions
- selected states
- data visualization

### Healthy

Green / teal

Used for:

- RUNNING
- NORMAL
- GOOD
- HEALTHY
- STREAM LIVE
- INGESTION RUNNING

### Warning

Amber / orange

Used for:

- WARNING
- DRY WELL
- BLOCKED INTAKE
- GAS INTERFERENCE
- degraded states

### Critical

Red

Used for:

- CRITICAL
- TRIPPED
- POWER LOSS
- FAULT
- ANOMALY
- disconnected state

### Equipment identifiers

Purple accents can be used for:

- asset IDs
- pump identifiers
- equipment tags
- selected equipment

Do not use colors randomly. Colors should communicate meaning.

---

# 8. PAGE STRUCTURE

Build one long scrollable page.

Use clear visual separation between sections.

Suggested structure:

## SECTION 1 — HEADER

Create a compact industrial navigation/header.

Include:

- application name
- ESP monitoring identity
- navigation anchors to sections
- connection indicators
- important global actions

Keep the header compact.

---

## SECTION 2 — SYSTEM SUMMARY

Create a horizontal responsive row of metric cards similar to the reference.

Examples:

- SQLite/Ingested Records
- Ingestion Rate
- Active Wells & Fleets
- Dataset Categories
- Pause Buffer

IMPORTANT:

These are just UI categories.

Their values must come from the backend.

Cards should support responsive wrapping.

---

## SECTION 3 — MQTT / INGESTION CONTROL

Recreate the control area shown in the reference image.

Include fields/controls for:

- Host / IP
- Port
- User
- Password
- Topics
- Storage mode
- Ingest fault filter
- State filter
- Pump family
- Filter mode
- Apply Settings
- Connect
- Play
- Pause
- Buffer

Connect these directly to the existing application state/API.

Do not introduce fake connection logic.

Connection status should reflect the real backend state.

---

# 9. LIVE TELEMETRY TABLE

Create a large data table similar to the screenshots.

Possible columns include whatever fields the backend actually returns, such as:

- ID
- Time
- Category
- Well
- Asset / Pump
- Fault / Alarms
- Discharge Pressure
- Intake Pressure
- Flow
- Frequency
- Current
- Temperature
- State / Trip

The exact displayed fields should be dynamically mapped from the real backend response.

Requirements:

- responsive horizontal scrolling
- sticky header if appropriate
- compact rows
- status badges
- fault badges
- live indicator
- readable technical values
- pagination/record loading based on existing backend behavior

Do not invent missing telemetry values.

If a backend field is unavailable, display:

`—`

or the existing application's unavailable state.

---

# 10. ACTIVE DIAGNOSIS / FAULT BANNER

Create a visually prominent diagnosis panel similar to the reference.

Display live values for things such as:

- current active state
- diagnosis
- severity
- future risk
- anomaly score
- confidence
- RUL, if available

Examples from the screenshots include concepts like:

- Power Loss
- CRITICAL
- Future Risk: HIGH
- Anomaly Score
- RUL unavailable

But these should be populated dynamically from the backend.

Do not hardcode "Power Loss" or any other diagnosis.

---

# 11. ESP SYSTEM VISUALIZATION

Recreate the ESP schematic/well visualization style from the reference.

Show a technical vertical ESP/well layout with:

- surface equipment
- power cable
- tubing
- casing
- pump
- intake
- discharge
- perforations
- downhole sensors
- markers
- telemetry points
- status indicators

This should look like an engineering diagram, not a generic illustration.

IMPORTANT:

The visualization must use live backend data for:

- equipment identity
- telemetry values
- status
- alarms
- selected asset
- operating state

Hovering/clicking a marker should show the corresponding live telemetry.

Do not draw values directly into the SVG as hardcoded text.

Create reusable components for:

- WellDiagram
- EquipmentMarker
- TelemetryTooltip
- EquipmentStatus

---

# 12. OPERATING ENVELOPE

Create the parameter monitoring section shown in the screenshot.

Display the real monitored parameters returned by the backend.

For each parameter show:

- parameter name
- current value
- unit
- expected operating range
- current deviation
- status
- data source
- availability

Examples include:

- Total Liquid Production Rate
- Pump Intake Pressure
- Pump Discharge Pressure
- Motor Current
- Motor Load
- Motor Temperature
- Pump Vibration RMS
- Motor Supply Voltage
- Intake Fluid Temperature
- Flowline Header Pressure
- Wellhead Tubing Pressure
- Casing Annulus Pressure
- Surface Choke Orifice Size

Do not assume these fields exist.

Build the component so it can render whichever parameter definitions are supplied by the backend.

---

# 13. OPERATING POINT / PUMP CURVE

Recreate the operating-point panel.

Show:

- flow rate
- differential head
- operating frequency
- pump curve if available

If the backend says the pump curve is unavailable, show a proper unavailable state similar to the screenshot.

Do not generate a fake pump curve to fill the empty space.

---

# 14. SYNCHRONIZED TIME-SERIES

Create the multi-parameter time-series chart section.

Support multiple series such as:

- Discharge Pressure
- Intake Pressure
- Motor Current
- Motor Temperature

The data must come from the backend.

Use real timestamps.

Support:

- hover tooltips
- legend
- zoom where appropriate
- responsive sizing
- empty state
- loading state
- live updates where backend supports them

Do not insert demo points.

---

# 15. DETAILED TREND CHARTS

Create chart cards similar to the reference screenshot.

Examples:

### Chart 1
Discharge Pressure + Intake Pressure

### Chart 2
Flow Rate + Motor Frequency

These must be dynamically driven from actual backend telemetry.

Support:

- asset selection
- chart range
- refresh
- timestamps
- legends
- units
- real values

---

# 16. HISTORICAL SCENARIO / REPLAY

Recreate the historical replay controls.

Include:

- Historical Scenario selector
- Playback Speed
- Load Sequence
- Play
- Pause
- Samples Loaded

Connect them to the existing backend functionality.

Do not implement a fake replay engine.

If historical replay functionality already exists, reuse it.

---

# 17. WELL / FLEET HEALTH OVERVIEW

Create a responsive grid of asset cards similar to the reference screenshots.

Each card should dynamically represent one real asset/well.

Show whatever live backend fields are available, for example:

- Well ID
- Asset ID
- status
- discharge pressure
- intake pressure
- flow
- motor current
- motor temperature
- frequency
- health
- fault

Use semantic status colors.

Examples:

RUNNING → green

TRIPPED → red

WARNING → amber

UNKNOWN → neutral

Do not manually create a fixed list of assets.

---

# 18. EXPORT / DATABASE CONTROLS

Include:

- Export Labelled CSV
- Export Unlabelled CSV
- Clear Database

These controls must continue using the application's actual existing backend functionality.

Do not replace them with frontend-only downloads.

Before connecting these buttons, find the existing implementation and reuse it.

---

# 19. GLOBAL STATUS BAR

Create a compact status area showing real application state.

Examples:

- MQTT: Connected / Disconnected
- Ingestion: Running / Paused
- Stream: Live / Offline

These values must be based on actual application state.

Do not hardcode them.

---

# 20. RESPONSIVENESS

The page must work correctly at:

- desktop
- laptop
- tablet
- smaller screens

For large desktop screens, use the dense multi-column industrial dashboard layout from the references.

For smaller screens:

- reduce column count
- stack cards
- preserve readability
- allow horizontal scrolling for large tables/charts where necessary
- do not squash technical content until it becomes unreadable

---

# 21. COMPONENT ARCHITECTURE

Do not create one huge React component.

Break the page into reusable components such as:

```text
ESPMonitoringPage
├── Header
├── SystemSummary
├── IngestionControls
├── LiveTelemetryTable
├── DiagnosisBanner
├── ESPWellVisualization
├── OperatingEnvelope
├── PumpOperatingPoint
├── MultiParameterTimeline
├── TrendCharts
├── HistoricalReplay
├── FleetHealthGrid
├── AssetCard
├── ExportControls
└── SystemStatusBar
```

Use the project's existing component conventions where possible.

Do not introduce a new architecture unnecessarily.

---

# 22. DATA / UI SEPARATION

Keep UI components presentational where possible.

Prefer a structure like:

```text
API / WebSocket / MQTT
        ↓
Existing service layer
        ↓
Existing hooks / state
        ↓
Data mapping
        ↓
React components
        ↓
UI
```

Do not put API calls directly into every visual component.

Reuse the existing data access layer.

---

# 23. LOADING / EMPTY / ERROR STATES

Every live section must handle:

### Loading

Show an elegant technical skeleton/loading state.

### Empty

Show:

`No telemetry available`

or another appropriate message based on the real state.

### Error

Show a clear error state without crashing the entire dashboard.

### Stale data

Where supported by the backend, visually indicate stale telemetry.

The application should never display fake data simply because the API is empty.

---

# 24. VISUAL QUALITY

The final result must look like a polished **industrial ESP operations dashboard**, not a basic collection of cards.

Pay attention to:

- spacing
- typography
- border hierarchy
- visual density
- alignment
- status semantics
- chart readability
- table readability
- consistent component heights
- responsive behavior
- section hierarchy

Use subtle animations only where they reinforce live monitoring.

Do NOT add excessive animations.

---

# 25. REFERENCE IMAGE INTERPRETATION

Treat the attached screenshots as the visual design reference.

Specifically preserve the visual language of:

- dark ESP monitoring panels
- engineering-style telemetry
- compact cards
- technical tables
- cyan/green/red/purple status semantics
- monitoring charts
- fault banners
- well diagrams
- fleet cards
- industrial control panels

The goal is NOT pixel-for-pixel copying.

The goal is to create a cohesive single-page product UI using the same design language.

---

# 26. CRITICAL IMPLEMENTATION RULE

Before writing new frontend code:

### Step 1
Inspect the existing frontend.

### Step 2
Inspect the backend API/service/data flow.

### Step 3
Identify what data already exists.

### Step 4
Identify what components already exist and can be reused.

### Step 5
Map each visual section to an existing source of truth.

### Step 6
Only then implement the redesigned page.

Do not start by creating mock data.

---

# 27. DO NOT BREAK EXISTING FEATURES

The following must continue working after the redesign:

- MQTT connection
- ingestion
- live telemetry
- filtering
- asset selection
- fault filtering
- state filtering
- pump family filtering
- historical loading
- replay
- chart refresh
- CSV export
- database actions
- existing backend communication
- existing real-time updates
- asset/well selection
- fault/diagnostic information

Regression-test these after the UI changes.

---

# 28. ACCEPTANCE CRITERIA

The implementation is complete only when:

1. The entire frontend is presented as one coherent scrollable React page.
2. The visual language closely matches the supplied screenshots.
3. Existing backend functionality remains intact.
4. No live application values are hardcoded.
5. All telemetry comes from the real backend.
6. Charts use real backend data.
7. Well/asset cards are generated dynamically from backend data.
8. Faults and statuses are dynamically mapped.
9. MQTT/ingestion/stream status reflects actual application state.
10. Existing controls still work.
11. Historical replay still works.
12. Exports still work.
13. Loading/empty/error states are handled.
14. Responsive behavior works.
15. No mock/demo data is used in production paths.
16. No unnecessary backend changes are introduced.

---

# 29. FINAL REQUIREMENT

Before finishing, inspect the implementation and answer internally:

**"If the backend data changes right now, will the UI automatically show the new values without modifying the React source code?"**

The answer must be YES.

Also verify:

**"If the backend returns a different number of wells/assets/records, will the UI adapt automatically?"**

The answer must be YES.

Do not consider the task complete until both are true.

Finally, provide a concise summary of:

- files/components changed
- existing backend sources reused
- any new frontend data mappings
- any backend changes, if absolutely unavoidable
- tests/verification performed

Do not claim anything is live or connected unless you actually verified it in the existing application.