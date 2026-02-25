/**
 * Veyra CustomCSS — Live custom CSS editor
 */

import Logger from "../utils/logger";
import DataStore from "./datastore";
import DOMManager from "./dommanager";
import SettingsManager from "./settingsmanager";

const CustomCSS = {
    _editor: null,
    _css: "",

    initialize() {
        this._css = DataStore.load("customcss", "value") || "";

        if (SettingsManager.get("customCSS", "enabled")) {
            this.enable();
        }

        Logger.log("CustomCSS", "Custom CSS module initialized");
    },

    /**
     * Enable custom CSS injection
     */
    enable() {
        DOMManager.injectStyle("custom-css", this._css);
        SettingsManager.set("customCSS", "enabled", true);
    },

    /**
     * Disable custom CSS injection
     */
    disable() {
        DOMManager.removeStyle("custom-css");
        SettingsManager.set("customCSS", "enabled", false);
    },

    /**
     * Toggle custom CSS
     */
    toggle() {
        if (SettingsManager.get("customCSS", "enabled")) {
            this.disable();
        } else {
            this.enable();
        }
    },

    /**
     * Update the custom CSS
     */
    update(css) {
        this._css = css;
        DataStore.save("customcss", "value", css);
        if (SettingsManager.get("customCSS", "enabled")) {
            DOMManager.updateStyle("custom-css", css);
        }
    },

    /**
     * Get current custom CSS
     */
    getCSS() {
        return this._css;
    },

    /**
     * Clear custom CSS
     */
    clear() {
        this.update("");
    },

    /**
     * Check if custom CSS is enabled
     */
    isEnabled() {
        return SettingsManager.get("customCSS", "enabled") || false;
    },

    /**
     * Create the CSS editor panel element
     */
    createEditorPanel() {
        const container = document.createElement("div");
        container.className = "veyra-css-editor-container";

        // Toolbar
        const toolbar = document.createElement("div");
        toolbar.className = "veyra-css-editor-toolbar";

        const title = document.createElement("span");
        title.className = "veyra-css-editor-title";
        title.textContent = "Custom CSS";

        const actions = document.createElement("div");
        actions.className = "veyra-css-editor-actions";

        // Toggle button
        const toggleBtn = document.createElement("button");
        toggleBtn.className = `veyra-btn veyra-btn-sm ${this.isEnabled() ? "veyra-btn-success" : "veyra-btn-muted"}`;
        toggleBtn.textContent = this.isEnabled() ? "Enabled" : "Disabled";
        toggleBtn.addEventListener("click", () => {
            this.toggle();
            toggleBtn.textContent = this.isEnabled() ? "Enabled" : "Disabled";
            toggleBtn.className = `veyra-btn veyra-btn-sm ${this.isEnabled() ? "veyra-btn-success" : "veyra-btn-muted"}`;
        });

        // Save button
        const saveBtn = document.createElement("button");
        saveBtn.className = "veyra-btn veyra-btn-sm veyra-btn-primary";
        saveBtn.textContent = "Save & Apply";
        saveBtn.addEventListener("click", () => {
            this.update(textarea.value);
        });

        // Clear button
        const clearBtn = document.createElement("button");
        clearBtn.className = "veyra-btn veyra-btn-sm veyra-btn-danger";
        clearBtn.textContent = "Clear";
        clearBtn.addEventListener("click", () => {
            textarea.value = "";
            this.clear();
        });

        actions.append(toggleBtn, saveBtn, clearBtn);
        toolbar.append(title, actions);

        // Editor area
        const editorWrap = document.createElement("div");
        editorWrap.className = "veyra-css-editor-wrap";

        const textarea = document.createElement("textarea");
        textarea.className = "veyra-css-editor-textarea";
        textarea.placeholder = "/* Enter your custom CSS here */\n\n.example {\n    color: #C4A265;\n}";
        textarea.value = this._css;
        textarea.spellcheck = false;

        // Live preview (auto-apply on typing)
        let liveTimer = null;
        textarea.addEventListener("input", () => {
            clearTimeout(liveTimer);
            liveTimer = setTimeout(() => {
                if (this.isEnabled()) {
                    this.update(textarea.value);
                }
            }, 500);
        });

        // Tab support
        textarea.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + "    " + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }
            // Ctrl+S to save
            if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.update(textarea.value);
            }
        });

        editorWrap.appendChild(textarea);
        container.append(toolbar, editorWrap);

        return container;
    }
};

export default CustomCSS;
