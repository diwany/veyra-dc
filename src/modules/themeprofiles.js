/**
 * Veyra Theme Profiles — Auto-switch themes per server/channel
 * Unique Veyra feature: Context-aware theme switching
 */

import Logger from "../utils/logger";
import DataStore from "../modules/datastore";
import ThemeManager from "../modules/thememanager";
import WebpackModules from "../modules/webpackmodules";

const ThemeProfiles = {
    _profiles: {},      // { guildId: themeName }
    _channelProfiles: {},// { channelId: themeName }
    _currentGuild: null,
    _currentChannel: null,
    _originalTheme: null,
    _unsubscribe: null,

    initialize() {
        this._profiles = DataStore.load("themeprofiles", "guilds") || {};
        this._channelProfiles = DataStore.load("themeprofiles", "channels") || {};

        this._watchNavigation();
        Logger.log("ThemeProfiles", "Theme Profiles initialized");
    },

    /**
     * Watch for navigation changes to switch themes
     */
    _watchNavigation() {
        try {
            const Dispatcher = WebpackModules.findByProps("dispatch", "subscribe");
            if (!Dispatcher) return;

            const handler = (event) => {
                if (event.type === "CHANNEL_SELECT") {
                    this._onNavigate(event.guildId, event.channelId);
                }
            };

            Dispatcher.subscribe("CHANNEL_SELECT", handler);
            this._unsubscribe = () => Dispatcher.unsubscribe("CHANNEL_SELECT", handler);
        } catch (e) {
            Logger.warn("ThemeProfiles", "Could not subscribe to navigation events", e);
        }
    },

    _onNavigate(guildId, channelId) {
        // Check channel-specific profile first
        if (channelId && this._channelProfiles[channelId]) {
            this._applyProfile(this._channelProfiles[channelId]);
            return;
        }

        // Then check guild-specific profile
        if (guildId && this._profiles[guildId]) {
            this._applyProfile(this._profiles[guildId]);
            return;
        }

        // Revert to original if no profile set
        if (this._originalTheme) {
            this._applyProfile(this._originalTheme);
        }
    },

    _applyProfile(themeName) {
        const allThemes = ThemeManager.getAll();
        for (const theme of allThemes) {
            if (theme.name === themeName) {
                if (!theme.enabled) ThemeManager.enable(theme.name);
            }
            // Don't disable other themes — let user stack if desired
        }
    },

    /**
     * Set a theme profile for a server
     */
    setGuildProfile(guildId, themeName) {
        this._profiles[guildId] = themeName;
        DataStore.save("themeprofiles", "guilds", this._profiles);
        Logger.log("ThemeProfiles", `Set profile for guild ${guildId}: ${themeName}`);
    },

    /**
     * Set a theme profile for a channel
     */
    setChannelProfile(channelId, themeName) {
        this._channelProfiles[channelId] = themeName;
        DataStore.save("themeprofiles", "channels", this._channelProfiles);
    },

    /**
     * Remove a guild profile
     */
    removeGuildProfile(guildId) {
        delete this._profiles[guildId];
        DataStore.save("themeprofiles", "guilds", this._profiles);
    },

    /**
     * Remove a channel profile
     */
    removeChannelProfile(channelId) {
        delete this._channelProfiles[channelId];
        DataStore.save("themeprofiles", "channels", this._channelProfiles);
    },

    /**
     * Get all profiles
     */
    getGuildProfiles() {
        return { ...this._profiles };
    },

    getChannelProfiles() {
        return { ...this._channelProfiles };
    },

    /**
     * Create the profiles management panel
     */
    createPanel() {
        const container = document.createElement("div");
        container.className = "veyra-settings-panel";

        const header = document.createElement("div");
        header.className = "veyra-section-header";
        header.innerHTML = `
            <h2 class="veyra-section-title">Theme Profiles</h2>
            <p class="veyra-section-subtitle">Automatically switch themes based on which server or channel you're viewing</p>
        `;
        container.appendChild(header);

        // Current profiles
        const group = document.createElement("div");
        group.className = "veyra-settings-group";

        const title = document.createElement("h3");
        title.className = "veyra-group-title";
        title.textContent = "Server Profiles";
        group.appendChild(title);

        const profiles = this.getGuildProfiles();
        const entries = Object.entries(profiles);

        if (entries.length === 0) {
            const empty = document.createElement("div");
            empty.className = "veyra-setting-description";
            empty.textContent = "No server profiles set. Right-click a server icon or use the command palette to assign a theme.";
            empty.style.padding = "12px 0";
            group.appendChild(empty);
        } else {
            for (const [guildId, themeName] of entries) {
                const item = document.createElement("div");
                item.className = "veyra-setting-item";
                item.innerHTML = `
                    <div class="veyra-setting-info">
                        <div class="veyra-setting-label">Server: ${guildId}</div>
                        <div class="veyra-setting-description">Theme: ${themeName}</div>
                    </div>
                `;
                const removeBtn = document.createElement("button");
                removeBtn.className = "veyra-btn veyra-btn-sm veyra-btn-danger";
                removeBtn.textContent = "Remove";
                removeBtn.addEventListener("click", () => {
                    this.removeGuildProfile(guildId);
                    item.remove();
                });
                item.appendChild(removeBtn);
                group.appendChild(item);
            }
        }

        container.appendChild(group);
        return container;
    },

    cleanup() {
        if (this._unsubscribe) this._unsubscribe();
    }
};

export default ThemeProfiles;
