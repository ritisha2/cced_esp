/**
 * ESP Historical Scenario Replay Frontend Controller
 */

class ESPReplayController {
    constructor() {
        this.isPlaying = false;
        this.speed = 1.0;
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const btnPlay = document.getElementById("btnReplayPlay");
        const btnPause = document.getElementById("btnReplayPause");
        const selSpeed = document.getElementById("selReplaySpeed");
        const selScenario = document.getElementById("selReplayScenario");
        const btnLoad = document.getElementById("btnReplayLoad");

        if (btnLoad) {
            btnLoad.addEventListener("click", async () => {
                const fault = selScenario ? selScenario.value : "ALL";
                const res = await fetch("/api/esp/replay/control", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "load", fault_class: fault })
                });
                const json = await res.json();
                const countEl = document.getElementById("replayRecordCount");
                if (countEl) countEl.textContent = `${json.total_records || 0} samples loaded`;
            });
        }

        if (btnPlay) {
            btnPlay.addEventListener("click", async () => {
                const spd = selSpeed ? parseFloat(selSpeed.value) : 1.0;
                await fetch("/api/esp/replay/control", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "start", speed: spd })
                });
                this.isPlaying = true;
                btnPlay.classList.add("active");
                if (btnPause) btnPause.classList.remove("active");
            });
        }

        if (btnPause) {
            btnPause.addEventListener("click", async () => {
                await fetch("/api/esp/replay/control", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "pause" })
                });
                this.isPlaying = false;
                btnPause.classList.add("active");
                if (btnPlay) btnPlay.classList.remove("active");
            });
        }
    }
}

window.espReplay = new ESPReplayController();
document.addEventListener("DOMContentLoaded", () => {
    window.espReplay.init();
});
