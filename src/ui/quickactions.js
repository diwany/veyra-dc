/**
 * Veyra Quick Actions — Command Palette (Ctrl+Shift+P)
 * Unique Veyra feature: Spotlight-style command palette for fast access
 */

import Logger from "../utils/logger";
import DOMManager from "../modules/dommanager";
import PluginManager from "../modules/pluginmanager";
import ThemeManager from "../modules/thememanager";
import CustomCSS from "../modules/customcss";
import UIManager from "./uimanager";

const QuickActions = {
    _open: false,
    _actions: [],
    _overlay: null,

    initialize() {
        this._registerDefaultActions();
        this._bindHotkey();
        Logger.log("QuickActions", "Command palette initialized (Ctrl+Shift+P)");
    },

    _bindHotkey() {
        document.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === "Escape" && this._open) {
                this.close();
            }
        });
    },

    _registerDefaultActions() {
        this._actions = [
            // Settings
            { id: "open-settings", label: "Open Veyra Settings", category: "Settings", icon: "⚙️", action: () => UIManager.openSettings() },
            { id: "open-plugins", label: "Open Plugins Panel", category: "Settings", icon: "🧩", action: () => { UIManager.openSettings(); setTimeout(() => UIManager.openSection("veyra-plugins"), 100); }},
            { id: "open-themes", label: "Open Themes Panel", category: "Settings", icon: "🎨", action: () => { UIManager.openSettings(); setTimeout(() => UIManager.openSection("veyra-themes"), 100); }},
            { id: "open-css", label: "Open Custom CSS Editor", category: "Settings", icon: "✏️", action: () => { UIManager.openSettings(); setTimeout(() => UIManager.openSection("veyra-customcss"), 100); }},

            // CSS
            { id: "toggle-css", label: "Toggle Custom CSS", category: "CSS", icon: "🔄", action: () => CustomCSS.toggle() },
            { id: "clear-css", label: "Clear Custom CSS", category: "CSS", icon: "🗑️", action: () => CustomCSS.clear() },

            // Themes
            ...this._getThemeActions(),

            // Plugins
            ...this._getPluginActions(),

            // Tools
            { id: "reload-discord", label: "Reload Discord", category: "Tools", icon: "🔃", action: () => location.reload() },
            { id: "toggle-devtools", label: "Toggle DevTools", category: "Tools", icon: "🛠️", action: () => { if (window.require) { const { remote } = window.require("electron"); remote.getCurrentWindow().toggleDevTools(); }}},
            { id: "copy-version", label: "Copy Veyra Version", category: "Tools", icon: "📋", action: () => navigator.clipboard.writeText("Veyra v1.0.0") },
            { id: "clear-cache", label: "Clear Veyra Cache", category: "Tools", icon: "🧹", action: () => { Object.keys(localStorage).filter(k => k.startsWith("veyra_")).forEach(k => localStorage.removeItem(k)); location.reload(); }},
            { id: "export-settings", label: "Export All Settings", category: "Tools", icon: "📤", action: () => this._exportAll() },
            { id: "perf-monitor", label: "Toggle Performance Monitor", category: "Tools", icon: "📊", action: () => { if (window.VeyraPerformanceMonitor) window.VeyraPerformanceMonitor.toggle(); }},
            { id: "open-snippets", label: "Open Snippet Manager", category: "Tools", icon: "📝", action: () => { if (window.VeyraSnippetManager) window.VeyraSnippetManager.openPanel(); }},
        ];
    },

    _getThemeActions() {
        return ThemeManager.getAll().map(theme => ({
            id: `toggle-theme-${theme.name}`,
            label: `Toggle Theme: ${theme.name}`,
            category: "Themes",
            icon: theme.enabled ? "✅" : "⬜",
            action: () => ThemeManager.toggle(theme.name)
        }));
    },

    _getPluginActions() {
        return PluginManager.getAll().map(plugin => ({
            id: `toggle-plugin-${plugin.name}`,
            label: `Toggle Plugin: ${plugin.name}`,
            category: "Plugins",
            icon: plugin.started ? "✅" : "⬜",
            action: () => PluginManager.toggle(plugin.name)
        }));
    },

    _exportAll() {
        const data = {};
        Object.keys(localStorage).filter(k => k.startsWith("veyra_")).forEach(k => {
            try { data[k] = JSON.parse(localStorage.getItem(k)); } catch(e) { data[k] = localStorage.getItem(k); }
        });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `veyra-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Register a custom action (for plugins to add commands)
     */
    registerAction(action) {
        if (!action.id || !action.label || !action.action) return;
        this._actions.push(action);
    },

    /**
     * Unregister a custom action
     */
    unregisterAction(id) {
        this._actions = this._actions.filter(a => a.id !== id);
    },

    toggle() {
        this._open ? this.close() : this.open();
    },

    open() {
        if (this._open) return;
        this._open = true;

        // Refresh dynamic actions
        this._registerDefaultActions();

        const overlay = document.createElement("div");
        overlay.className = "veyra-quickactions-overlay";
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) this.close();
        });

        const palette = document.createElement("div");
        palette.className = "veyra-quickactions-palette";

        // Search input
        const searchWrap = document.createElement("div");
        searchWrap.className = "veyra-quickactions-search-wrap";

        const searchIcon = document.createElement("span");
        searchIcon.className = "veyra-quickactions-search-icon";
        searchIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4A265" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

        const input = document.createElement("input");
        input.type = "text";
        input.className = "veyra-quickactions-input";
        input.placeholder = "Type a command...";
        input.autofocus = true;

        searchWrap.append(searchIcon, input);

        // Results container
        const results = document.createElement("div");
        results.className = "veyra-quickactions-results";

        this._renderResults(results, this._actions);

        // Search filtering
        let selectedIndex = 0;
        input.addEventListener("input", () => {
            const query = input.value.toLowerCase().trim();
            const filtered = query
                ? this._actions.filter(a =>
                    a.label.toLowerCase().includes(query) ||
                    (a.category && a.category.toLowerCase().includes(query))
                )
                : this._actions;
            selectedIndex = 0;
            this._renderResults(results, filtered, selectedIndex);
        });

        // Keyboard navigation
        input.addEventListener("keydown", (e) => {
            const items = results.querySelectorAll(".veyra-quickactions-item");
            if (e.key === "ArrowDown") {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                this._highlightItem(items, selectedIndex);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                this._highlightItem(items, selectedIndex);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (items[selectedIndex]) items[selectedIndex].click();
            }
        });

        palette.append(searchWrap, results);
        overlay.appendChild(palette);
        document.body.appendChild(overlay);
        this._overlay = overlay;

        requestAnimationFrame(() => input.focus());
    },

    close() {
        if (!this._open) return;
        this._open = false;
        if (this._overlay) {
            this._overlay.style.animation = "veyra-fade-out 0.15s ease";
            setTimeout(() => { this._overlay?.remove(); this._overlay = null; }, 150);
        }
    },

    _renderResults(container, actions, selectedIndex = 0) {
        container.innerHTML = "";
        let lastCategory = "";

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];

            if (action.category && action.category !== lastCategory) {
                lastCategory = action.category;
                const cat = document.createElement("div");
                cat.className = "veyra-quickactions-category";
                cat.textContent = action.category;
                container.appendChild(cat);
            }

            const item = document.createElement("div");
            item.className = `veyra-quickactions-item${i === selectedIndex ? " selected" : ""}`;
            item.innerHTML = `
                <span class="veyra-quickactions-item-icon">${action.icon || "▸"}</span>
                <span class="veyra-quickactions-item-label">${action.label}</span>
            `;
            item.addEventListener("click", () => {
                this.close();
                try { action.action(); } catch(e) { Logger.error("QuickActions", "Action failed", e); }
            });
            item.addEventListener("mouseenter", () => {
                container.querySelectorAll(".veyra-quickactions-item").forEach(el => el.classList.remove("selected"));
                item.classList.add("selected");
            });
            container.appendChild(item);
        }

        if (actions.length === 0) {
            const empty = document.createElement("div");
            empty.className = "veyra-quickactions-empty";
            empty.textContent = "No matching commands found";
            container.appendChild(empty);
        }
    },

    _highlightItem(items, index) {
        items.forEach((el, i) => {
            el.classList.toggle("selected", i === index);
            if (i === index) el.scrollIntoView({ block: "nearest" });
        });
    }
};

export default QuickActions;
