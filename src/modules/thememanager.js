/**
 * Veyra ThemeManager — Load, enable, disable, and manage themes
 */

import Logger from "../utils/logger";
import DataStore from "./datastore";
import DOMManager from "./dommanager";

const ThemeManager = {
    _themes: new Map(),
    _enabled: new Set(),

    async initialize() {
        // Load saved enabled state
        const savedEnabled = DataStore.load("themes", "enabled") || [];
        for (const name of savedEnabled) {
            this._enabled.add(name);
        }

        // Load built-in theme
        this._loadVeyraTheme();

        // Auto-enable previously enabled themes
        for (const name of this._enabled) {
            if (this._themes.has(name)) {
                this.enable(name);
            }
        }

        Logger.log("ThemeManager", `Loaded ${this._themes.size} themes`);
    },

    /**
     * Load the default Veyra theme
     */
    _loadVeyraTheme() {
        this.register({
            name: "Veyra Dark",
            description: "The default Veyra theme with greyscale color scheme",
            version: "1.0.0",
            author: "Veyra Team",
            css: this._getVeyraThemeCSS()
        });
    },

    _getVeyraThemeCSS() {
        return `
            /* Veyra Dark Theme */
            .theme-dark {
                --background-primary: #111111;
                --background-secondary: #1A1A1A;
                --background-secondary-alt: #1D1D1D;
                --background-tertiary: #0D0D0D;
                --background-accent: #C4A265;
                --background-floating: #222222;
                --background-modifier-hover: rgba(196, 162, 101, 0.08);
                --background-modifier-active: rgba(196, 162, 101, 0.12);
                --background-modifier-selected: rgba(196, 162, 101, 0.15);
                --background-modifier-accent: rgba(196, 162, 101, 0.05);
                --channeltextarea-background: #222222;
                --text-normal: #DCDDDE;
                --text-muted: #888888;
                --text-link: #D4B87A;
                --interactive-normal: #B9BBBE;
                --interactive-hover: #D4B87A;
                --interactive-active: #C4A265;
                --interactive-muted: #4A4A4A;
                --header-primary: #FFFFFF;
                --header-secondary: #B9BBBE;
                --brand-experiment: #C4A265;
                --brand-experiment-560: #A88B4A;
                --scrollbar-thin-thumb: #222222;
                --scrollbar-thin-track: transparent;
                --scrollbar-auto-thumb: #222222;
                --scrollbar-auto-scrollbar-color-thumb: #222222;
            }

            /* Veyra accent overrides */
            .theme-dark [class*="button"][class*="lookFilled"],
            .theme-dark [class*="colorBrand"] {
                background-color: #C4A265 !important;
            }

            .theme-dark [class*="button"][class*="lookFilled"]:hover {
                background-color: #D4B87A !important;
            }

            /* Sidebar / Server list */
            .theme-dark [class*="scroller"][class*="guilds"] {
                background-color: #0D0D0D !important;
            }

            /* Selected channel */
            .theme-dark [class*="modeSelected"] {
                background-color: rgba(196, 162, 101, 0.15) !important;
            }

            .theme-dark [class*="modeSelected"] [class*="name"] {
                color: #C4A265 !important;
            }

            /* Mention highlight */
            .theme-dark [class*="mentioned"] {
                background-color: rgba(196, 162, 101, 0.08) !important;
                border-left-color: #C4A265 !important;
            }

            /* Links */
            .theme-dark a {
                color: #D4B87A;
            }

            /* Selection */
            .theme-dark ::selection {
                background-color: rgba(196, 162, 101, 0.3);
            }

            /* Scrollbar */
            .theme-dark ::-webkit-scrollbar-thumb {
                background-color: #2A2A2A;
                border-radius: 4px;
            }

            .theme-dark ::-webkit-scrollbar-track {
                background-color: transparent;
            }
        `;
    },

    /**
     * Register a theme
     */
    register(theme) {
        if (!theme || !theme.name) {
            Logger.error("ThemeManager", "Invalid theme: missing name");
            return false;
        }

        const meta = {
            name: theme.name,
            description: theme.description || "No description provided",
            version: theme.version || "1.0.0",
            author: theme.author || "Unknown",
            css: theme.css || "",
            enabled: false
        };

        this._themes.set(theme.name, meta);
        Logger.log("ThemeManager", `Registered theme: ${theme.name}`);
        return true;
    },

    /**
     * Unregister a theme
     */
    unregister(name) {
        if (this.isEnabled(name)) {
            this.disable(name);
        }
        this._themes.delete(name);
    },

    /**
     * Enable a theme
     */
    enable(name) {
        const theme = this._themes.get(name);
        if (!theme) {
            Logger.error("ThemeManager", `Theme not found: ${name}`);
            return false;
        }

        if (theme.enabled) return true;

        try {
            DOMManager.injectStyle(`theme-${name}`, theme.css);
            theme.enabled = true;
            this._enabled.add(name);
            this._saveEnabledState();
            Logger.log("ThemeManager", `Enabled: ${name}`);
            return true;
        } catch (e) {
            Logger.error("ThemeManager", `Failed to enable theme: ${name}`, e);
            return false;
        }
    },

    /**
     * Disable a theme
     */
    disable(name) {
        const theme = this._themes.get(name);
        if (!theme) return false;

        if (!theme.enabled) return true;

        try {
            DOMManager.removeStyle(`theme-${name}`);
            theme.enabled = false;
            this._enabled.delete(name);
            this._saveEnabledState();
            Logger.log("ThemeManager", `Disabled: ${name}`);
            return true;
        } catch (e) {
            Logger.error("ThemeManager", `Failed to disable theme: ${name}`, e);
            return false;
        }
    },

    /**
     * Toggle a theme
     */
    toggle(name) {
        return this.isEnabled(name) ? this.disable(name) : this.enable(name);
    },

    /**
     * Check if a theme is enabled
     */
    isEnabled(name) {
        const theme = this._themes.get(name);
        return theme ? theme.enabled : false;
    },

    /**
     * Get a theme
     */
    get(name) {
        return this._themes.get(name);
    },

    /**
     * Get all themes
     */
    getAll() {
        return Array.from(this._themes.values());
    },

    /**
     * Disable all themes
     */
    disableAll() {
        for (const [name] of this._themes) {
            this.disable(name);
        }
    },

    /**
     * Load a theme from CSS string
     */
    loadFromString(name, css, meta = {}) {
        this.register({
            name,
            css,
            ...meta
        });
    },

    /**
     * Load theme from a CSS file content
     */
    loadFromFile(content) {
        // Parse meta from CSS comments: /** @name ThemeName ... */
        const metaRegex = /\/\*\*\s*\n([\s\S]*?)\*\//;
        const match = content.match(metaRegex);
        const meta = {};

        if (match) {
            const metaStr = match[1];
            const lines = metaStr.split("\n");
            for (const line of lines) {
                const m = line.match(/@(\w+)\s+(.*)/);
                if (m) {
                    meta[m[1].trim()] = m[2].trim();
                }
            }
        }

        if (!meta.name) {
            meta.name = "Unnamed Theme " + Date.now();
        }

        this.register({
            ...meta,
            css: content
        });

        return meta.name;
    },

    /**
     * Save enabled state
     */
    _saveEnabledState() {
        DataStore.save("themes", "enabled", Array.from(this._enabled));
    }
};

export default ThemeManager;
