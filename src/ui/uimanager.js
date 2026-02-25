/**
 * Veyra UI Manager — Controls all Veyra UI elements
 */

import Logger from "../utils/logger";
import DOMManager from "../modules/dommanager";
import SettingsPanel from "./panels/settingspanel";
import veyraStyles from "../styles/veyra.css";
import veyraLogoDataUri from "../../assets/veyra-logo-small.png";

const UIManager = {
    _settingsOpen: false,

    initialize() {
        // Inject core styles
        DOMManager.injectStyle("veyra-core", veyraStyles);
        Logger.log("UIManager", "UI Manager initialized");
    },

    /**
     * Inject the Veyra settings button into Discord's settings
     */
    injectSettingsButton() {
        this._watchForSettingsMenu();
    },

    /**
     * Watch for Discord's settings sidebar to appear and inject our button
     */
    _watchForSettingsMenu() {
        DOMManager.observe(document.body, (mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    // Only react when Discord's User Settings layer opens
                    // It uses a standardSidebarView or layers container
                    const isSettingsLayer =
                        node.querySelector?.('[class*="standardSidebarView"]') ||
                        node.matches?.('[class*="standardSidebarView"]') ||
                        node.querySelector?.('[class*="sidebarRegion"]') ||
                        node.matches?.('[class*="sidebarRegion"]');
                    if (isSettingsLayer) {
                        setTimeout(() => this._injectIntoSidebar(), 300);
                    }
                }
            }
        });
    },

    _injectIntoSidebar() {
        // Don't double-inject
        if (document.querySelector(".veyra-settings-header")) return;

        // Only inject inside Discord's settings view, not arbitrary sidebars
        const settingsView = document.querySelector('[class*="standardSidebarView"]');
        if (!settingsView) return;

        const sidebarItems = settingsView.querySelector('[class*="sidebarRegion"] [class*="content"]') ||
                             settingsView.querySelector('[class*="side"] [class*="content"]');
        if (!sidebarItems) return;

        // Find a suitable injection point (before "Log Out" or near the end)
        const separator = document.createElement("div");
        separator.className = "veyra-settings-header";
        separator.innerHTML = `
            <div class="veyra-sidebar-header">
                <img src="${veyraLogoDataUri}" class="veyra-sidebar-logo" alt="Veyra" />
                <span>Veyra</span>
            </div>
        `;

        const items = [
            { label: "Settings", id: "veyra-settings" },
            { label: "Plugins", id: "veyra-plugins" },
            { label: "Themes", id: "veyra-themes" },
            { label: "Snippets", id: "veyra-snippets" },
            { label: "Theme Profiles", id: "veyra-profiles" },
            { label: "Custom CSS", id: "veyra-customcss" },
        ];

        const fragment = document.createDocumentFragment();
        fragment.appendChild(separator);

        for (const item of items) {
            const el = document.createElement("div");
            el.className = "veyra-sidebar-item";
            el.textContent = item.label;
            el.dataset.section = item.id;
            el.addEventListener("click", () => {
                // Remove selection from other items
                document.querySelectorAll(".veyra-sidebar-item").forEach(i => i.classList.remove("selected"));
                el.classList.add("selected");
                this.openSection(item.id);
            });
            fragment.appendChild(el);
        }

        // Find the right place to inject (look for separators / headers in sidebar)
        const headers = sidebarItems.querySelectorAll('[class*="header"]');
        if (headers.length > 0) {
            const lastHeader = headers[headers.length - 1];
            lastHeader.parentNode.insertBefore(fragment, lastHeader);
        } else {
            sidebarItems.appendChild(fragment);
        }
    },

    /**
     * Open a Veyra settings section
     */
    openSection(sectionId) {
        const contentArea = document.querySelector('[class*="contentRegion"]') ||
                           document.querySelector('[class*="contentColumn"]');
        if (!contentArea) return;

        // Clear existing content
        const inner = contentArea.querySelector('[class*="contentColumn"]') || contentArea;
        
        // Create Veyra settings container
        let container = document.querySelector(".veyra-settings-content");
        if (!container) {
            container = document.createElement("div");
            container.className = "veyra-settings-content";
            inner.innerHTML = "";
            inner.appendChild(container);
        } else {
            container.innerHTML = "";
        }

        const panel = SettingsPanel.render(sectionId);
        container.appendChild(panel);
    },

    /**
     * Open the Veyra modal settings panel (standalone)
     */
    openSettings() {
        if (this._settingsOpen) return;
        this._settingsOpen = true;

        const overlay = document.createElement("div");
        overlay.className = "veyra-modal-overlay";
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) this.closeSettings();
        });

        const modal = document.createElement("div");
        modal.className = "veyra-modal";

        // Header
        const header = document.createElement("div");
        header.className = "veyra-modal-header";
        header.innerHTML = `
            <div class="veyra-modal-title">
                <img src="${veyraLogoDataUri}" class="veyra-modal-logo" alt="Veyra" />
                <h2>Veyra Settings</h2>
            </div>
        `;

        const closeBtn = document.createElement("button");
        closeBtn.className = "veyra-modal-close";
        closeBtn.innerHTML = "✕";
        closeBtn.addEventListener("click", () => this.closeSettings());
        header.appendChild(closeBtn);

        // Sidebar
        const sidebar = document.createElement("div");
        sidebar.className = "veyra-modal-sidebar";

        const sections = [
            { label: "General", id: "veyra-settings" },
            { label: "Plugins", id: "veyra-plugins" },
            { label: "Themes", id: "veyra-themes" },
            { label: "Snippets", id: "veyra-snippets" },
            { label: "Theme Profiles", id: "veyra-profiles" },
            { label: "Custom CSS", id: "veyra-customcss" },
        ];

        for (const section of sections) {
            const btn = document.createElement("div");
            btn.className = "veyra-modal-sidebar-item";
            btn.textContent = section.label;
            btn.addEventListener("click", () => {
                sidebar.querySelectorAll(".veyra-modal-sidebar-item").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                body.innerHTML = "";
                body.appendChild(SettingsPanel.render(section.id));
            });
            sidebar.appendChild(btn);
        }

        // Body
        const body = document.createElement("div");
        body.className = "veyra-modal-body";
        body.appendChild(SettingsPanel.render("veyra-settings"));

        // Activate first sidebar item
        sidebar.querySelector(".veyra-modal-sidebar-item").classList.add("active");

        const content = document.createElement("div");
        content.className = "veyra-modal-content";
        content.append(sidebar, body);

        modal.append(header, content);
        overlay.appendChild(modal);

        document.body.appendChild(overlay);

        // Escape to close
        const escHandler = (e) => {
            if (e.key === "Escape") {
                this.closeSettings();
                document.removeEventListener("keydown", escHandler);
            }
        };
        document.addEventListener("keydown", escHandler);
    },

    /**
     * Close the Veyra modal settings panel
     */
    closeSettings() {
        this._settingsOpen = false;
        const overlay = document.querySelector(".veyra-modal-overlay");
        if (overlay) {
            overlay.style.animation = "veyra-fade-out 0.2s ease";
            setTimeout(() => overlay.remove(), 200);
        }
    },

    /**
     * Cleanup UI
     */
    cleanup() {
        DOMManager.removeStyle("veyra-core");
        document.querySelectorAll(".veyra-settings-header, .veyra-sidebar-item").forEach(el => el.remove());
        this.closeSettings();
        Logger.log("UIManager", "UI cleaned up");
    }
};

export default UIManager;
