/**
 * Veyra PluginManager — Load, enable, disable, and manage plugins
 */

import Logger from "../utils/logger";
import DataStore from "./datastore";
import Patcher from "./patcher";
import Utils from "../utils/utils";

const PluginManager = {
    _plugins: new Map(),
    _enabled: new Set(),

    async initialize() {
        // Load saved enabled state
        const savedEnabled = DataStore.load("plugins", "enabled") || [];
        for (const name of savedEnabled) {
            this._enabled.add(name);
        }

        // Load built-in/registered plugins
        await this._loadBuiltinPlugins();

        // Auto-enable previously enabled plugins
        for (const name of this._enabled) {
            if (this._plugins.has(name)) {
                this.enable(name);
            }
        }

        Logger.log("PluginManager", `Loaded ${this._plugins.size} plugins`);
    },

    async _loadBuiltinPlugins() {
        // Built-in plugins will be registered here
    },

    /**
     * Register a plugin
     */
    register(plugin) {
        if (!plugin || !plugin.name) {
            Logger.error("PluginManager", "Invalid plugin: missing name");
            return false;
        }

        const meta = {
            name: plugin.name,
            description: plugin.description || "No description provided",
            version: plugin.version || "1.0.0",
            author: plugin.author || "Unknown",
            instance: plugin,
            started: false
        };

        this._plugins.set(plugin.name, meta);
        Logger.log("PluginManager", `Registered plugin: ${plugin.name} v${meta.version}`);
        return true;
    },

    /**
     * Unregister a plugin
     */
    unregister(name) {
        if (this.isEnabled(name)) {
            this.disable(name);
        }
        this._plugins.delete(name);
    },

    /**
     * Enable a plugin
     */
    enable(name) {
        const plugin = this._plugins.get(name);
        if (!plugin) {
            Logger.error("PluginManager", `Plugin not found: ${name}`);
            return false;
        }

        if (plugin.started) return true;

        try {
            if (typeof plugin.instance.start === "function") {
                plugin.instance.start();
            }
            plugin.started = true;
            this._enabled.add(name);
            this._saveEnabledState();
            Logger.log("PluginManager", `Enabled: ${name}`);
            return true;
        } catch (e) {
            Logger.error("PluginManager", `Failed to start plugin: ${name}`, e);
            return false;
        }
    },

    /**
     * Disable a plugin
     */
    disable(name) {
        const plugin = this._plugins.get(name);
        if (!plugin) return false;

        if (!plugin.started) return true;

        try {
            if (typeof plugin.instance.stop === "function") {
                plugin.instance.stop();
            }
            // Clean up any patches made by this plugin
            Patcher.unpatchAll(name);
            plugin.started = false;
            this._enabled.delete(name);
            this._saveEnabledState();
            Logger.log("PluginManager", `Disabled: ${name}`);
            return true;
        } catch (e) {
            Logger.error("PluginManager", `Failed to stop plugin: ${name}`, e);
            return false;
        }
    },

    /**
     * Toggle a plugin
     */
    toggle(name) {
        return this.isEnabled(name) ? this.disable(name) : this.enable(name);
    },

    /**
     * Check if a plugin is enabled
     */
    isEnabled(name) {
        const plugin = this._plugins.get(name);
        return plugin ? plugin.started : false;
    },

    /**
     * Get a plugin's meta information
     */
    get(name) {
        return this._plugins.get(name);
    },

    /**
     * Get all plugins
     */
    getAll() {
        return Array.from(this._plugins.values());
    },

    /**
     * Get plugin settings panel
     */
    getSettingsPanel(name) {
        const plugin = this._plugins.get(name);
        if (!plugin) return null;

        if (typeof plugin.instance.getSettingsPanel === "function") {
            try {
                return plugin.instance.getSettingsPanel();
            } catch (e) {
                Logger.error("PluginManager", `Error getting settings panel for ${name}`, e);
            }
        }
        return null;
    },

    /**
     * Reload a plugin
     */
    reload(name) {
        const wasEnabled = this.isEnabled(name);
        if (wasEnabled) this.disable(name);
        // Re-enable if it was running
        if (wasEnabled) this.enable(name);
    },

    /**
     * Disable all plugins
     */
    disableAll() {
        for (const [name] of this._plugins) {
            this.disable(name);
        }
    },

    /**
     * Load a plugin from code string
     */
    loadFromString(code) {
        try {
            const pluginFunc = new Function("Veyra", "module", "exports", code);
            const module = { exports: {} };
            pluginFunc(window.Veyra, module, module.exports);

            const PluginClass = module.exports.default || module.exports;
            let plugin;

            if (typeof PluginClass === "function") {
                plugin = new PluginClass();
            } else {
                plugin = PluginClass;
            }

            if (plugin && plugin.name) {
                this.register(plugin);
                return plugin.name;
            }
            return null;
        } catch (e) {
            Logger.error("PluginManager", "Failed to load plugin from string", e);
            return null;
        }
    },

    /**
     * Save enabled state
     */
    _saveEnabledState() {
        DataStore.save("plugins", "enabled", Array.from(this._enabled));
    }
};

export default PluginManager;
