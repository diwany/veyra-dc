/**
 * Veyra WebpackModules — Find and access Discord's internal webpack modules
 */

import Logger from "../utils/logger";

const WebpackModules = {
    _modules: null,
    _require: null,

    initialize() {
        this._findWebpackRequire();
        Logger.log("WebpackModules", "Module system initialized");
    },

    _findWebpackRequire() {
        if (this._require) return;

        // Try to hook into Discord's webpack
        if (typeof window.webpackChunkdiscord_app !== "undefined") {
            const chunk = [[Symbol()], {}, (req) => { this._require = req; }];
            window.webpackChunkdiscord_app.push(chunk);
            window.webpackChunkdiscord_app.pop();
        }

        // Fallback: search `window` for push-based chunk loaders
        if (!this._require) {
            for (const key of Object.keys(window)) {
                if (key.startsWith("webpackChunk")) {
                    try {
                        const chunk = [[Symbol()], {}, (req) => { this._require = req; }];
                        window[key].push(chunk);
                        window[key].pop();
                        if (this._require) break;
                    } catch (e) { /* skip */ }
                }
            }
        }
    },

    /**
     * Get all loaded webpack modules
     */
    getAllModules() {
        if (this._modules) return this._modules;
        if (!this._require) {
            this._findWebpackRequire();
            if (!this._require) return {};
        }

        const cache = this._require.c;
        if (!cache) return {};

        this._modules = {};
        for (const id in cache) {
            if (cache[id] && cache[id].exports) {
                this._modules[id] = cache[id].exports;
            }
        }
        return this._modules;
    },

    /**
     * Find a module using a filter function
     */
    find(filter, first = true) {
        const modules = this.getAllModules();
        const results = [];

        for (const id in modules) {
            const module = modules[id];
            if (!module) continue;

            try {
                if (filter(module)) {
                    if (first) return module;
                    results.push(module);
                }
                if (module.default && filter(module.default)) {
                    if (first) return module.default;
                    results.push(module.default);
                }
            } catch (e) { /* skip broken modules */ }
        }

        return first ? null : results;
    },

    /**
     * Find all modules matching a filter
     */
    findAll(filter) {
        return this.find(filter, false);
    },

    /**
     * Find a module by display name (React components)
     */
    findByDisplayName(name) {
        return this.find(m =>
            m?.displayName === name ||
            m?.default?.displayName === name
        );
    },

    /**
     * Find a module by its props/keys
     */
    findByProps(...props) {
        return this.find(m => {
            if (!m) return false;
            return props.every(p => m[p] !== undefined);
        });
    },

    /**
     * Find all modules with given props
     */
    findAllByProps(...props) {
        return this.findAll(m => {
            if (!m) return false;
            return props.every(p => m[p] !== undefined);
        });
    },

    /**
     * Find a module by prototype fields
     */
    findByPrototypes(...protos) {
        return this.find(m => {
            if (!m?.prototype) return false;
            return protos.every(p => m.prototype[p] !== undefined);
        });
    },

    /**
     * Find a module containing a string in its source
     */
    findByString(...strings) {
        return this.find(m => {
            if (!m) return false;
            const str = m.toString ? m.toString() : "";
            return strings.every(s => str.includes(s));
        });
    },

    /**
     * Find a module by its webpack module ID
     */
    findByModuleId(id) {
        const modules = this.getAllModules();
        return modules[id] || null;
    },

    /**
     * Get commonly used Discord modules lazily
     */
    get DiscordModules() {
        return {
            get React() { return WebpackModules.findByProps("createElement", "Fragment"); },
            get ReactDOM() { return WebpackModules.findByProps("render", "createPortal"); },
            get Dispatcher() { return WebpackModules.findByProps("dispatch", "subscribe"); },
            get UserStore() { return WebpackModules.findByProps("getCurrentUser", "getUser"); },
            get GuildStore() { return WebpackModules.findByProps("getGuild", "getGuilds"); },
            get ChannelStore() { return WebpackModules.findByProps("getChannel", "getDMFromUserId"); },
            get MessageActions() { return WebpackModules.findByProps("sendMessage", "editMessage"); },
            get NavigationUtils() { return WebpackModules.findByProps("transitionTo", "replaceWith"); },
            get ModalActions() { return WebpackModules.findByProps("openModal", "closeModal"); },
            get Permissions() { return WebpackModules.findByProps("Permissions", "RolePermissions"); },
            get SelectedChannelStore() { return WebpackModules.findByProps("getChannelId", "getVoiceChannelId"); },
            get SelectedGuildStore() { return WebpackModules.findByProps("getGuildId", "getLastSelectedGuildId"); },
            get RelationshipStore() { return WebpackModules.findByProps("getRelationships", "isFriend"); },
            get UserSettingsStore() { return WebpackModules.findByProps("locale", "theme"); },
            get Markdown() { return WebpackModules.findByDisplayName("Markdown") || WebpackModules.findByProps("rules", "parse"); },
            get Tooltip() { return WebpackModules.findByDisplayName("Tooltip"); },
            get Button() { return WebpackModules.findByProps("Colors", "Looks", "Sizes"); },
            get Switch() { return WebpackModules.findByDisplayName("Switch"); },
            get TextInput() { return WebpackModules.findByDisplayName("TextInput"); },
            get Slider() { return WebpackModules.findByDisplayName("Slider"); },
        };
    },

    /**
     * Invalidate module cache (force re-scan)
     */
    invalidateCache() {
        this._modules = null;
    }
};

export default WebpackModules;
