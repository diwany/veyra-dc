/**
 * Veyra PluginManager — Load, enable, disable, and manage plugins
 * Loads .plugin.js files from the plugins folder via VeyraNative IPC bridge.
 */

import Logger from "../utils/logger";
import DataStore from "./datastore";
import Patcher from "./patcher";

const PluginManager = {
    _plugins: new Map(),
    _enabled: new Set(),

    async initialize() {
        // Load saved enabled state
        const savedEnabled = DataStore.load("plugins", "enabled") || [];
        for (const name of savedEnabled) {
            this._enabled.add(name);
        }

        // Load plugins from disk
        await this._loadPluginsFromDisk();

        // Auto-enable previously enabled plugins
        for (const name of this._enabled) {
            if (this._plugins.has(name)) {
                this.enable(name);
            }
        }

        Logger.log("PluginManager", `Loaded ${this._plugins.size} plugins`);
    },

    /**
     * Scan the plugins directory and load all .plugin.js files
     */
    async _loadPluginsFromDisk() {
        if (!window.VeyraNative) {
            Logger.log("PluginManager", "VeyraNative not available — skipping disk loading");
            return;
        }

        try {
            const paths = await window.VeyraNative.getPaths();
            const pluginsDir = paths.plugins;

            await window.VeyraNative.mkdir(pluginsDir);

            const files = await window.VeyraNative.readdir(pluginsDir);
            const pluginFiles = files.filter(f => f.endsWith(".plugin.js") || f.endsWith(".js"));

            for (const file of pluginFiles) {
                try {
                    const sep = pluginsDir.includes("/") ? "/" : "\\";
                    const filePath = pluginsDir + sep + file;
                    const code = await window.VeyraNative.readFile(filePath);
                    if (!code) continue;

                    this._loadPluginCode(code, file);
                } catch (e) {
                    Logger.error("PluginManager", `Failed to load ${file}: ${e.message}`);
                }
            }
        } catch (e) {
            Logger.error("PluginManager", `Failed to scan plugins directory: ${e.message}`);
        }
    },

    /**
     * Load a plugin from source code
     */
    _loadPluginCode(code, filename) {
        try {
            const meta = this._parseMeta(code);

            const module = { exports: {} };
            const exports = module.exports;

            // Minimal require polyfill for common BD plugin dependencies
            const fakeRequire = (mod) => {
                if (mod === "electron") {
                    return { shell: { openExternal: (url) => window.open(url, "_blank") } };
                }
                if (mod === "fs" || mod === "path" || mod === "request") {
                    Logger.warn("PluginManager", `Plugin "${meta.name || filename}" tried to require("${mod}")`);
                    return {};
                }
                return {};
            };

            const wrappedCode = `(function(module, exports, require, BdApi, VeyraAPI) {\n${code}\n})`;
            const func = (0, eval)(wrappedCode);
            func(module, exports, fakeRequire, window.BdApi, window.VeyraAPI);

            const PluginExport = module.exports.default || module.exports;
            let plugin;

            if (typeof PluginExport === "function") {
                plugin = new PluginExport();
            } else if (typeof PluginExport === "object" && PluginExport !== null) {
                plugin = PluginExport;
            }

            if (plugin) {
                if (!plugin.name && meta.name) plugin.name = meta.name;
                if (!plugin.description && meta.description) plugin.description = meta.description;
                if (!plugin.version && meta.version) plugin.version = meta.version;
                if (!plugin.author && meta.author) plugin.author = meta.author;

                if (!plugin.name) {
                    plugin.name = filename.replace(/\.plugin\.js$/, "").replace(/\.js$/, "");
                }

                plugin._filename = filename;
                this.register(plugin);
                Logger.log("PluginManager", `Loaded from disk: ${plugin.name} (${filename})`);
                return plugin.name;
            } else {
                Logger.warn("PluginManager", `${filename} did not export a valid plugin`);
            }
        } catch (e) {
            Logger.error("PluginManager", `Failed to evaluate ${filename}: ${e.message}`);
        }
        return null;
    },

    /**
     * Parse @name, @description, @version, @author from JSDoc-style comments
     */
    _parseMeta(code) {
        const meta = {};
        const metaRegex = /\/\*\*\s*\n([\s\S]*?)\s*\*\//;
        const match = code.match(metaRegex);
        if (match) {
            const lines = match[1].split("\n");
            for (const line of lines) {
                const m = line.match(/@(\w+)\s+(.*)/);
                if (m) meta[m[1].trim()] = m[2].trim();
            }
        }
        return meta;
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
            started: false,
            filename: plugin._filename || null
        };

        this._plugins.set(plugin.name, meta);
        Logger.log("PluginManager", `Registered plugin: ${plugin.name} v${meta.version}`);
        return true;
    },

    unregister(name) {
        if (this.isEnabled(name)) this.disable(name);
        this._plugins.delete(name);
    },

    enable(name) {
        const plugin = this._plugins.get(name);
        if (!plugin) {
            Logger.error("PluginManager", `Plugin not found: ${name}`);
            return false;
        }
        if (plugin.started) return true;

        try {
            if (typeof plugin.instance.start === "function") plugin.instance.start();
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

    disable(name) {
        const plugin = this._plugins.get(name);
        if (!plugin) return false;
        if (!plugin.started) return true;

        try {
            if (typeof plugin.instance.stop === "function") plugin.instance.stop();
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

    toggle(name) {
        return this.isEnabled(name) ? this.disable(name) : this.enable(name);
    },

    isEnabled(name) {
        const plugin = this._plugins.get(name);
        return plugin ? plugin.started : false;
    },

    get(name) {
        return this._plugins.get(name);
    },

    getAll() {
        return Array.from(this._plugins.values());
    },

    getSettingsPanel(name) {
        const plugin = this._plugins.get(name);
        if (!plugin) return null;
        if (typeof plugin.instance.getSettingsPanel === "function") {
            try { return plugin.instance.getSettingsPanel(); }
            catch (e) { Logger.error("PluginManager", `Error getting settings panel for ${name}`, e); }
        }
        return null;
    },

    async reload(name) {
        const plugin = this._plugins.get(name);
        if (!plugin) return;

        const wasEnabled = plugin.started;
        if (wasEnabled) this.disable(name);

        if (plugin.filename && window.VeyraNative) {
            try {
                const paths = await window.VeyraNative.getPaths();
                const sep = paths.plugins.includes("/") ? "/" : "\\";
                const filePath = paths.plugins + sep + plugin.filename;
                const code = await window.VeyraNative.readFile(filePath);
                if (code) {
                    this._plugins.delete(name);
                    this._loadPluginCode(code, plugin.filename);
                }
            } catch (e) {
                Logger.error("PluginManager", `Failed to reload ${name} from disk`, e);
            }
        }

        if (wasEnabled) this.enable(name);
    },

    disableAll() {
        for (const [name] of this._plugins) this.disable(name);
    },

    loadFromString(code) {
        return this._loadPluginCode(code, "inline-" + Date.now() + ".js");
    },

    _saveEnabledState() {
        DataStore.save("plugins", "enabled", Array.from(this._enabled));
    }
};

export default PluginManager;
