/**
 * Veyra SettingsManager — Manages all Veyra settings
 */

import Logger from "../utils/logger";
import Config from "../core/config";
import DataStore from "./datastore";
import Utils from "../utils/utils";

const SettingsManager = {
    _settings: {},
    _listeners: new Map(),

    initialize() {
        // Load saved settings and merge with defaults
        this._settings = Utils.deepMerge(
            Utils.deepClone(Config.defaultSettings),
            DataStore.loadSettings("all") || {}
        );
        Logger.log("SettingsManager", "Settings loaded");
    },

    /**
     * Get a setting value
     */
    get(category, key) {
        if (!this._settings[category]) return undefined;
        return this._settings[category][key];
    },

    /**
     * Set a setting value
     */
    set(category, key, value) {
        if (!this._settings[category]) {
            this._settings[category] = {};
        }
        
        const oldValue = this._settings[category][key];
        this._settings[category][key] = value;
        
        // Save to persistent storage
        DataStore.saveSettings("all", this._settings);
        
        // Notify listeners
        this._notifyListeners(category, key, value, oldValue);
        
        return true;
    },

    /**
     * Get all settings for a category
     */
    getCategory(category) {
        return this._settings[category] || {};
    },

    /**
     * Set an entire category
     */
    setCategory(category, settings) {
        this._settings[category] = settings;
        DataStore.saveSettings("all", this._settings);
    },

    /**
     * Reset settings to default
     */
    resetCategory(category) {
        if (Config.defaultSettings[category]) {
            this._settings[category] = Utils.deepClone(Config.defaultSettings[category]);
            DataStore.saveSettings("all", this._settings);
        }
    },

    /**
     * Reset all settings
     */
    resetAll() {
        this._settings = Utils.deepClone(Config.defaultSettings);
        DataStore.saveSettings("all", this._settings);
    },

    /**
     * Listen for setting changes
     */
    on(category, callback) {
        if (!this._listeners.has(category)) {
            this._listeners.set(category, new Set());
        }
        this._listeners.get(category).add(callback);
        return () => this.off(category, callback);
    },

    /**
     * Remove a listener
     */
    off(category, callback) {
        const listeners = this._listeners.get(category);
        if (listeners) listeners.delete(callback);
    },

    /**
     * Notify listeners
     */
    _notifyListeners(category, key, value, oldValue) {
        const listeners = this._listeners.get(category);
        if (listeners) {
            for (const cb of listeners) {
                try {
                    cb(key, value, oldValue);
                } catch (e) {
                    Logger.error("SettingsManager", "Error in settings listener", e);
                }
            }
        }
    },

    /**
     * Get all settings
     */
    getAll() {
        return Utils.deepClone(this._settings);
    },

    /**
     * Export settings as JSON string
     */
    exportSettings() {
        return JSON.stringify(this._settings, null, 2);
    },

    /**
     * Import settings from JSON string
     */
    importSettings(json) {
        try {
            const imported = JSON.parse(json);
            this._settings = Utils.deepMerge(
                Utils.deepClone(Config.defaultSettings),
                imported
            );
            DataStore.saveSettings("all", this._settings);
            Logger.log("SettingsManager", "Settings imported successfully");
            return true;
        } catch (e) {
            Logger.error("SettingsManager", "Failed to import settings", e);
            return false;
        }
    }
};

export default SettingsManager;
