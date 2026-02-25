/**
 * Veyra DataStore — Persistent data storage using localStorage and filesystem
 */

import Logger from "../utils/logger";
import Config from "../core/config";

const DataStore = {
    _cache: {},
    _prefix: "veyra_",

    initialize() {
        Logger.log("DataStore", "DataStore initialized");
    },

    /**
     * Save data to a store
     */
    save(store, key, value) {
        try {
            const storeKey = `${this._prefix}${store}`;
            let data = this._getStore(storeKey);
            data[key] = value;
            localStorage.setItem(storeKey, JSON.stringify(data));
            this._cache[storeKey] = data;
            return true;
        } catch (e) {
            Logger.error("DataStore", `Failed to save ${key} to ${store}`, e);
            return false;
        }
    },

    /**
     * Load data from a store
     */
    load(store, key) {
        try {
            const storeKey = `${this._prefix}${store}`;
            const data = this._getStore(storeKey);
            return data[key];
        } catch (e) {
            Logger.error("DataStore", `Failed to load ${key} from ${store}`, e);
            return undefined;
        }
    },

    /**
     * Delete data from a store
     */
    delete(store, key) {
        try {
            const storeKey = `${this._prefix}${store}`;
            let data = this._getStore(storeKey);
            delete data[key];
            localStorage.setItem(storeKey, JSON.stringify(data));
            this._cache[storeKey] = data;
            return true;
        } catch (e) {
            Logger.error("DataStore", `Failed to delete ${key} from ${store}`, e);
            return false;
        }
    },

    /**
     * Get all data from a store
     */
    getStore(store) {
        return this._getStore(`${this._prefix}${store}`);
    },

    /**
     * Clear an entire store
     */
    clearStore(store) {
        const storeKey = `${this._prefix}${store}`;
        localStorage.removeItem(storeKey);
        delete this._cache[storeKey];
    },

    /**
     * Save plugin data
     */
    savePluginData(pluginName, key, value) {
        return this.save(`plugin_${pluginName}`, key, value);
    },

    /**
     * Load plugin data
     */
    loadPluginData(pluginName, key) {
        return this.load(`plugin_${pluginName}`, key);
    },

    /**
     * Delete plugin data
     */
    deletePluginData(pluginName, key) {
        return this.delete(`plugin_${pluginName}`, key);
    },

    /**
     * Save settings
     */
    saveSettings(category, settings) {
        return this.save("settings", category, settings);
    },

    /**
     * Load settings
     */
    loadSettings(category) {
        return this.load("settings", category) || {};
    },

    /**
     * Internal: get a store
     */
    _getStore(storeKey) {
        if (this._cache[storeKey]) return this._cache[storeKey];
        try {
            const raw = localStorage.getItem(storeKey);
            const data = raw ? JSON.parse(raw) : {};
            this._cache[storeKey] = data;
            return data;
        } catch (e) {
            return {};
        }
    },

    /**
     * Export all Veyra data
     */
    exportData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this._prefix)) {
                data[key] = JSON.parse(localStorage.getItem(key));
            }
        }
        return data;
    },

    /**
     * Import Veyra data
     */
    importData(data) {
        for (const [key, value] of Object.entries(data)) {
            if (key.startsWith(this._prefix)) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        }
        this._cache = {};
        Logger.log("DataStore", "Data imported successfully");
    }
};

export default DataStore;
