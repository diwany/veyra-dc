/**
 * Veyra Performance Monitor — Real-time Discord performance dashboard
 * Unique Veyra feature: Built-in performance profiling overlay
 */

import Logger from "../utils/logger";
import DOMManager from "../modules/dommanager";

const PerformanceMonitor = {
    _visible: false,
    _element: null,
    _interval: null,
    _history: {
        fps: [],
        memory: [],
        dom: []
    },
    _maxHistory: 60,

    initialize() {
        window.VeyraPerformanceMonitor = this;
        Logger.log("PerformanceMonitor", "Performance Monitor ready (use command palette to toggle)");
    },

    toggle() {
        this._visible ? this.hide() : this.show();
    },

    show() {
        if (this._visible) return;
        this._visible = true;

        const el = document.createElement("div");
        el.className = "veyra-perfmon";
        el.innerHTML = `
            <div class="veyra-perfmon-header">
                <span class="veyra-perfmon-title">
                    <svg viewBox="0 0 100 87" width="14" height="12">
                        <polygon points="50,0 100,87 0,87" fill="none" stroke="#C4A265" stroke-width="6"/>
                    </svg>
                    Performance
                </span>
                <button class="veyra-perfmon-close">✕</button>
            </div>
            <div class="veyra-perfmon-body">
                <div class="veyra-perfmon-stat">
                    <span class="veyra-perfmon-label">FPS</span>
                    <span class="veyra-perfmon-value" id="veyra-perf-fps">--</span>
                </div>
                <canvas class="veyra-perfmon-graph" id="veyra-perf-fps-graph" width="200" height="40"></canvas>
                <div class="veyra-perfmon-stat">
                    <span class="veyra-perfmon-label">Memory</span>
                    <span class="veyra-perfmon-value" id="veyra-perf-memory">--</span>
                </div>
                <canvas class="veyra-perfmon-graph" id="veyra-perf-mem-graph" width="200" height="40"></canvas>
                <div class="veyra-perfmon-stat">
                    <span class="veyra-perfmon-label">DOM Nodes</span>
                    <span class="veyra-perfmon-value" id="veyra-perf-dom">--</span>
                </div>
                <div class="veyra-perfmon-stat">
                    <span class="veyra-perfmon-label">Listeners</span>
                    <span class="veyra-perfmon-value" id="veyra-perf-listeners">--</span>
                </div>
                <div class="veyra-perfmon-stat">
                    <span class="veyra-perfmon-label">Veyra Plugins</span>
                    <span class="veyra-perfmon-value" id="veyra-perf-plugins">--</span>
                </div>
                <div class="veyra-perfmon-stat">
                    <span class="veyra-perfmon-label">Uptime</span>
                    <span class="veyra-perfmon-value" id="veyra-perf-uptime">--</span>
                </div>
            </div>
        `;

        el.querySelector(".veyra-perfmon-close").addEventListener("click", () => this.hide());

        // Make draggable
        this._makeDraggable(el, el.querySelector(".veyra-perfmon-header"));

        document.body.appendChild(el);
        this._element = el;

        // FPS counter
        let lastTime = performance.now();
        let frames = 0;
        const startTime = Date.now();

        const countFrame = () => {
            frames++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                const fps = Math.round(frames * 1000 / (now - lastTime));
                this._history.fps.push(fps);
                if (this._history.fps.length > this._maxHistory) this._history.fps.shift();

                const fpsEl = document.getElementById("veyra-perf-fps");
                if (fpsEl) fpsEl.textContent = fps;
                this._drawGraph("veyra-perf-fps-graph", this._history.fps, 60, "#C4A265");

                frames = 0;
                lastTime = now;
            }

            if (this._visible) requestAnimationFrame(countFrame);
        };
        requestAnimationFrame(countFrame);

        // Other stats
        this._interval = setInterval(() => {
            // Memory
            if (performance.memory) {
                const mb = Math.round(performance.memory.usedJSHeapSize / 1048576);
                this._history.memory.push(mb);
                if (this._history.memory.length > this._maxHistory) this._history.memory.shift();

                const memEl = document.getElementById("veyra-perf-memory");
                if (memEl) memEl.textContent = `${mb} MB`;
                this._drawGraph("veyra-perf-mem-graph", this._history.memory, Math.max(...this._history.memory, 200), "#43B581");
            }

            // DOM nodes
            const domEl = document.getElementById("veyra-perf-dom");
            if (domEl) domEl.textContent = document.querySelectorAll("*").length.toLocaleString();

            // Event listeners (approximate)
            const listEl = document.getElementById("veyra-perf-listeners");
            if (listEl) listEl.textContent = "~" + document.querySelectorAll("[class]").length;

            // Plugins
            const plugEl = document.getElementById("veyra-perf-plugins");
            if (plugEl) {
                try {
                    const count = window.Veyra ? "Active" : "N/A";
                    plugEl.textContent = count;
                } catch(e) { plugEl.textContent = "N/A"; }
            }

            // Uptime
            const uptimeEl = document.getElementById("veyra-perf-uptime");
            if (uptimeEl) {
                const seconds = Math.floor((Date.now() - startTime) / 1000);
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                uptimeEl.textContent = `${m}m ${s}s`;
            }
        }, 1000);
    },

    hide() {
        this._visible = false;
        if (this._interval) { clearInterval(this._interval); this._interval = null; }
        if (this._element) { this._element.remove(); this._element = null; }
    },

    _drawGraph(canvasId, data, maxVal, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (data.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        const step = w / (this._maxHistory - 1);
        const offset = this._maxHistory - data.length;

        for (let i = 0; i < data.length; i++) {
            const x = (offset + i) * step;
            const y = h - (data[i] / maxVal) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Fill under the graph
        ctx.lineTo((offset + data.length - 1) * step, h);
        ctx.lineTo(offset * step, h);
        ctx.closePath();
        ctx.fillStyle = color.replace(")", ", 0.1)").replace("rgb", "rgba").replace("#", "");
        // Simple alpha fill
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _makeDraggable(element, handle) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        handle.style.cursor = "grab";

        handle.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            handle.style.cursor = "grabbing";
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${initialX + dx}px`;
            element.style.top = `${initialY + dy}px`;
            element.style.right = "auto";
            element.style.bottom = "auto";
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            handle.style.cursor = "grab";
        });
    }
};

export default PerformanceMonitor;
