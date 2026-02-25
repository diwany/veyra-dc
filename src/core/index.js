/**
 * Veyra — Enhanced Discord Experience
 * A fork of BetterDiscord (https://github.com/BetterDiscord/BetterDiscord)
 * with additional features: Command Palette, Snippet Manager, Theme Profiles,
 * Performance Monitor, and BetterDiscord plugin compatibility layer.
 *
 * Main entry point
 */

import Config from "./config";
import Logger from "../utils/logger";
import DOMManager from "../modules/dommanager";
import Patcher from "../modules/patcher";
import WebpackModules from "../modules/webpackmodules";
import PluginManager from "../modules/pluginmanager";
import ThemeManager from "../modules/thememanager";
import CustomCSS from "../modules/customcss";
import SettingsManager from "../modules/settingsmanager";
import DataStore from "../modules/datastore";
import SnippetManager from "../modules/snippetmanager";
import ThemeProfiles from "../modules/themeprofiles";
import PerformanceMonitor from "../modules/performancemonitor";
import VeyraAPI from "../api/index";
import UIManager from "../ui/uimanager";
import QuickActions from "../ui/quickactions";

const Veyra = {
    version: Config.version,
    name: Config.name,

    async start() {
        Logger.log("Core", `Starting ${Config.name} v${Config.version}...`);
        Logger.log("Core", "Fork of BetterDiscord — enhanced with Veyra features");

        try {
            // Initialize data storage
            DataStore.initialize();

            // Wait for Discord to load
            await this.waitForDiscord();
            Logger.log("Core", "Discord loaded, injecting Veyra...");

            // Initialize webpack module search
            WebpackModules.initialize();

            // Initialize DOM manager
            DOMManager.initialize();

            // Initialize patcher
            Patcher.initialize();

            // Set up the API (includes BdApi compatibility layer)
            VeyraAPI.initialize();

            // Initialize UI
            UIManager.initialize();

            // Load settings
            SettingsManager.initialize();

            // Load plugins
            await PluginManager.initialize();

            // Load themes
            await ThemeManager.initialize();

            // Load custom CSS
            CustomCSS.initialize();

            // ── Veyra-exclusive features ──

            // Snippet Manager: one-click CSS tweaks library
            SnippetManager.initialize();

            // Theme Profiles: auto-switch themes per server/channel
            ThemeProfiles.initialize();

            // Performance Monitor: real-time FPS/memory overlay
            PerformanceMonitor.initialize();

            // Quick Actions: Ctrl+Shift+P command palette
            QuickActions.initialize();

            // Inject settings button into Discord
            UIManager.injectSettingsButton();

            Logger.log("Core", `${Config.name} v${Config.version} loaded successfully!`);
        } catch (err) {
            Logger.log("Core", `ERROR during startup: ${err.message}`);
            console.error("[Veyra] Startup error:", err);
        }
    },

    waitForDiscord() {
        return new Promise((resolve) => {
            const check = () => {
                const appMount = document.getElementById("app-mount");
                const app = appMount && (appMount.querySelector('[class*="app"]') || appMount.querySelector('[class*="appMount"]'));
                const hasContent = app && app.children.length > 0;
                if (hasContent) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    },

    stop() {
        Logger.log("Core", "Shutting down Veyra...");
        PluginManager.disableAll();
        ThemeManager.disableAll();
        CustomCSS.disable();
        SnippetManager.getAll().forEach(s => { if (s.enabled) SnippetManager.disable(s.id); });
        ThemeProfiles.cleanup();
        PerformanceMonitor.hide();
        Patcher.unpatchAll();
        DOMManager.cleanup();
        UIManager.cleanup();
        Logger.log("Core", "Veyra shut down.");
    }
};

// Auto-start when loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => Veyra.start());
} else {
    Veyra.start();
}

export default Veyra;
