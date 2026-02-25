/**
 * Veyra API — Public API for plugins and themes
 * Fork heritage: BetterDiscord API compatible, with Veyra extensions
 */

import Logger from "../utils/logger";
import Patcher from "../modules/patcher";
import WebpackModules from "../modules/webpackmodules";
import DOMManager from "../modules/dommanager";
import DataStore from "../modules/datastore";
import PluginManager from "../modules/pluginmanager";
import ThemeManager from "../modules/thememanager";
import SettingsManager from "../modules/settingsmanager";
import CustomCSS from "../modules/customcss";
import Utils from "../utils/utils";
import Config from "../core/config";

const VeyraAPI = {
    initialize() {
        // Expose the API globally
        window.VeyraAPI = this;

        // BetterDiscord-compatible aliases (for plugin portability)
        window.BdApi = this._createBdApiCompat();

        Logger.log("API", "Veyra API initialized");
    },

    /* ===== Veyra Native API ===== */

    /**
     * Find a webpack module
     */
    findModule: (filter) => WebpackModules.find(filter),
    findAllModules: (filter) => WebpackModules.findAll(filter),
    findModuleByProps: (...props) => WebpackModules.findByProps(...props),
    findModuleByDisplayName: (name) => WebpackModules.findByDisplayName(name),
    findModuleByPrototypes: (...protos) => WebpackModules.findByPrototypes(...protos),

    /**
     * Access Discord's internal modules
     */
    get DiscordModules() { return WebpackModules.DiscordModules; },

    /**
     * Patching
     */
    Patcher: {
        before: (caller, module, method, callback) => Patcher.before(caller, module, method, callback),
        after: (caller, module, method, callback) => Patcher.after(caller, module, method, callback),
        instead: (caller, module, method, callback) => Patcher.instead(caller, module, method, callback),
        unpatchAll: (caller) => Patcher.unpatchAll(caller)
    },

    /**
     * DOM manipulation
     */
    DOM: {
        injectCSS: (id, css) => DOMManager.injectStyle(id, css),
        removeCSS: (id) => DOMManager.removeStyle(id),
        addElement: (id, element, target) => DOMManager.addElement(id, element, target),
        removeElement: (id) => DOMManager.removeElement(id),
        waitFor: (selector, timeout) => DOMManager.waitFor(selector, timeout)
    },

    /**
     * Data storage
     */
    Data: {
        save: (plugin, key, value) => DataStore.savePluginData(plugin, key, value),
        load: (plugin, key) => DataStore.loadPluginData(plugin, key),
        delete: (plugin, key) => DataStore.deletePluginData(plugin, key)
    },

    /**
     * UI utilities
     */
    UI: {
        showToast: (message, options) => Utils.showToast(message, options),
        createElement: (tag, attrs, ...children) => Utils.createElement(tag, attrs, ...children),
        showConfirmationModal: (title, content, options = {}) => {
            return new Promise((resolve) => {
                const result = confirm(`${title}\n\n${content}`);
                resolve(result);
                if (result && options.onConfirm) options.onConfirm();
                if (!result && options.onCancel) options.onCancel();
            });
        }
    },

    /**
     * React utilities
     */
    React: {
        getInternalInstance: (element) => Utils.getReactInstance(element),
        getOwnerInstance: (element) => Utils.getOwnerInstance(element),
        get React() { return WebpackModules.findByProps("createElement", "Fragment"); },
        get ReactDOM() { return WebpackModules.findByProps("render", "createPortal"); }
    },

    /**
     * Settings
     */
    Settings: {
        get: (category, key) => SettingsManager.get(category, key),
        set: (category, key, value) => SettingsManager.set(category, key, value),
        onChange: (category, callback) => SettingsManager.on(category, callback)
    },

    /**
     * Plugin management
     */
    Plugins: {
        getAll: () => PluginManager.getAll(),
        get: (name) => PluginManager.get(name),
        enable: (name) => PluginManager.enable(name),
        disable: (name) => PluginManager.disable(name),
        toggle: (name) => PluginManager.toggle(name),
        isEnabled: (name) => PluginManager.isEnabled(name),
        register: (plugin) => PluginManager.register(plugin)
    },

    /**
     * Theme management
     */
    Themes: {
        getAll: () => ThemeManager.getAll(),
        get: (name) => ThemeManager.get(name),
        enable: (name) => ThemeManager.enable(name),
        disable: (name) => ThemeManager.disable(name),
        toggle: (name) => ThemeManager.toggle(name),
        isEnabled: (name) => ThemeManager.isEnabled(name),
        register: (theme) => ThemeManager.register(theme)
    },

    /**
     * Version info
     */
    version: Config.version,
    name: Config.name,

    /* ===== BetterDiscord Compatibility Layer ===== */

    _createBdApiCompat() {
        return {
            // Meta
            name: "VeyraCompat",
            version: Config.version,

            // DOM
            injectCSS: (id, css) => DOMManager.injectStyle(id, css),
            clearCSS: (id) => DOMManager.removeStyle(id),

            // Data
            getData: (plugin, key) => DataStore.loadPluginData(plugin, key),
            setData: (plugin, key, value) => DataStore.savePluginData(plugin, key, value),
            deleteData: (plugin, key) => DataStore.deletePluginData(plugin, key),
            loadData: (plugin, key) => DataStore.loadPluginData(plugin, key),
            saveData: (plugin, key, value) => DataStore.savePluginData(plugin, key, value),

            // Webpack
            findModule: (filter) => WebpackModules.find(filter),
            findAllModules: (filter) => WebpackModules.findAll(filter),
            findModuleByProps: (...props) => WebpackModules.findByProps(...props),
            findModuleByDisplayName: (name) => WebpackModules.findByDisplayName(name),
            findModuleByPrototypes: (...protos) => WebpackModules.findByPrototypes(...protos),

            // Patcher
            Patcher: {
                before: (caller, module, method, callback) => Patcher.before(caller, module, method, callback),
                after: (caller, module, method, callback) => Patcher.after(caller, module, method, callback),
                instead: (caller, module, method, callback) => Patcher.instead(caller, module, method, callback),
                unpatchAll: (caller) => Patcher.unpatchAll(caller),
                getPatchesByCaller: (caller) => Patcher.getPatchesByCaller(caller)
            },

            // UI
            showToast: (message, options) => Utils.showToast(message, options),
            alert: (title, content) => alert(`${title}\n\n${content}`),
            showConfirmationModal: (title, content, options = {}) => {
                const result = confirm(`${title}\n\n${content}`);
                if (result && options.onConfirm) options.onConfirm();
                if (!result && options.onCancel) options.onCancel();
            },

            // React
            getInternalInstance: (node) => Utils.getReactInstance(node),

            // Plugins
            Plugins: {
                getAll: () => PluginManager.getAll().map(p => p.name),
                isEnabled: (name) => PluginManager.isEnabled(name),
                enable: (name) => PluginManager.enable(name),
                disable: (name) => PluginManager.disable(name),
                toggle: (name) => PluginManager.toggle(name),
                get: (name) => PluginManager.get(name)
            },

            // Themes
            Themes: {
                getAll: () => ThemeManager.getAll().map(t => t.name),
                isEnabled: (name) => ThemeManager.isEnabled(name),
                enable: (name) => ThemeManager.enable(name),
                disable: (name) => ThemeManager.disable(name),
                toggle: (name) => ThemeManager.toggle(name)
            },

            // React access
            React: null, // Lazy loaded
            ReactDOM: null,

            get _React() {
                return WebpackModules.findByProps("createElement", "Fragment");
            },
            get _ReactDOM() {
                return WebpackModules.findByProps("render", "createPortal");
            }
        };
    }
};

export default VeyraAPI;
