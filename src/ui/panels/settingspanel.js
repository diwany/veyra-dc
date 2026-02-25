/**
 * Veyra Settings Panel — Renders settings sections
 */

import SettingsManager from "../../modules/settingsmanager";
import PluginManager from "../../modules/pluginmanager";
import ThemeManager from "../../modules/thememanager";
import CustomCSS from "../../modules/customcss";
import SnippetManager from "../../modules/snippetmanager";
import ThemeProfiles from "../../modules/themeprofiles";
import veyraLogoDataUri from "../../../assets/veyra-logo-small.png";
import Config from "../../core/config";

const SettingsPanel = {
    render(sectionId) {
        switch (sectionId) {
            case "veyra-settings":
                return this.renderGeneralSettings();
            case "veyra-plugins":
                return this.renderPlugins();
            case "veyra-themes":
                return this.renderThemes();
            case "veyra-customcss":
                return this.renderCustomCSS();
            case "veyra-snippets":
                return this.renderSnippets();
            case "veyra-profiles":
                return this.renderThemeProfiles();
            default:
                return this.renderGeneralSettings();
        }
    },

    /**
     * Render General Settings
     */
    renderGeneralSettings() {
        const container = document.createElement("div");
        container.className = "veyra-settings-panel";

        // Header
        container.appendChild(this._createSectionHeader(
            "Veyra Settings",
            `v${Config.version} — Enhanced Discord Experience`
        ));

        // General settings
        container.appendChild(this._createSettingsGroup("General", [
            {
                key: "showToasts",
                label: "Show Toast Notifications",
                description: "Display notification toasts for Veyra events",
                category: "general"
            },
            {
                key: "publicServers",
                label: "Public Servers",
                description: "Enable the public servers browser button",
                category: "general"
            },
            {
                key: "voiceDisconnect",
                label: "Voice Disconnect",
                description: "Disconnect from voice when closing Discord",
                category: "general"
            },
            {
                key: "classNormalizer",
                label: "Class Normalizer",
                description: "Normalize Discord's obfuscated class names for themes",
                category: "general"
            },
            {
                key: "mediaKeys",
                label: "Disable Media Keys",
                description: "Prevent Discord from hijacking media keys",
                category: "general"
            }
        ]));

        // Appearance settings
        container.appendChild(this._createSettingsGroup("Appearance", [
            {
                key: "minimalMode",
                label: "Minimal Mode",
                description: "Hide elements to give a cleaner look",
                category: "appearance"
            },
            {
                key: "coloredText",
                label: "Colored Text",
                description: "Enable syntax-highlighted code blocks",
                category: "appearance"
            },
            {
                key: "hideGiftButton",
                label: "Hide Gift Button",
                description: "Hide the Nitro gift button in chat",
                category: "appearance"
            },
            {
                key: "hideGIFButton",
                label: "Hide GIF Button",
                description: "Hide the GIF button in chat",
                category: "appearance"
            },
            {
                key: "hideStickerButton",
                label: "Hide Sticker Button",
                description: "Hide the Sticker button in chat",
                category: "appearance"
            },
            {
                key: "twentyFourHourTimestamps",
                label: "24-Hour Timestamps",
                description: "Use 24-hour format for timestamps",
                category: "appearance"
            }
        ]));

        // Developer settings
        container.appendChild(this._createSettingsGroup("Developer", [
            {
                key: "debugMode",
                label: "Debug Mode",
                description: "Enable verbose logging for debugging",
                category: "developer"
            },
            {
                key: "devTools",
                label: "DevTools",
                description: "Enable DevTools access",
                category: "developer"
            },
            {
                key: "inspectElement",
                label: "Inspect Element",
                description: "Add Inspect Element to context menu",
                category: "developer"
            },
            {
                key: "reactDevTools",
                label: "React DevTools",
                description: "Enable React Developer Tools",
                category: "developer"
            }
        ]));

        // About section
        container.appendChild(this._createAboutSection());

        return container;
    },

    /**
     * Render Snippets panel
     */
    renderSnippets() {
        return SnippetManager.createPanel();
    },

    /**
     * Render Theme Profiles panel
     */
    renderThemeProfiles() {
        return ThemeProfiles.createPanel();
    },

    /**
     * Render Plugins panel
     */
    renderPlugins() {
        const container = document.createElement("div");
        container.className = "veyra-settings-panel";

        container.appendChild(this._createSectionHeader(
            "Plugins",
            "Extend Discord with powerful plugins"
        ));

        // Plugin controls
        const controls = document.createElement("div");
        controls.className = "veyra-panel-controls";

        const openFolderBtn = document.createElement("button");
        openFolderBtn.className = "veyra-btn veyra-btn-primary";
        openFolderBtn.textContent = "Open Plugins Folder";
        openFolderBtn.addEventListener("click", async () => {
            if (window.VeyraNative) {
                const paths = await window.VeyraNative.getPaths();
                window.VeyraNative.openPath(paths.plugins);
            }
        });

        const loadBtn = document.createElement("button");
        loadBtn.className = "veyra-btn veyra-btn-secondary";
        loadBtn.textContent = "Load Plugin";
        loadBtn.addEventListener("click", () => {
            this._showPluginLoader(container);
        });

        controls.append(openFolderBtn, loadBtn);
        container.appendChild(controls);

        // Plugin list
        const plugins = PluginManager.getAll();
        if (plugins.length === 0) {
            const empty = document.createElement("div");
            empty.className = "veyra-empty-state";
            empty.innerHTML = `
                <div class="veyra-empty-icon">
                    <svg viewBox="0 0 24 24" width="64" height="64" fill="#C4A265">
                        <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>
                    </svg>
                </div>
                <h3>No Plugins Installed</h3>
                <p>Place plugin files in the plugins folder or load one with the button above.</p>
            `;
            container.appendChild(empty);
        } else {
            const list = document.createElement("div");
            list.className = "veyra-addon-list";

            for (const plugin of plugins) {
                list.appendChild(this._createAddonCard(plugin, "plugin"));
            }

            container.appendChild(list);
        }

        return container;
    },

    /**
     * Render Themes panel
     */
    renderThemes() {
        const container = document.createElement("div");
        container.className = "veyra-settings-panel";

        container.appendChild(this._createSectionHeader(
            "Themes",
            "Customize Discord's appearance"
        ));

        // Theme controls
        const controls = document.createElement("div");
        controls.className = "veyra-panel-controls";

        const openFolderBtn = document.createElement("button");
        openFolderBtn.className = "veyra-btn veyra-btn-primary";
        openFolderBtn.textContent = "Open Themes Folder";
        openFolderBtn.addEventListener("click", async () => {
            if (window.VeyraNative) {
                const paths = await window.VeyraNative.getPaths();
                window.VeyraNative.openPath(paths.themes);
            }
        });

        const loadBtn = document.createElement("button");
        loadBtn.className = "veyra-btn veyra-btn-secondary";
        loadBtn.textContent = "Load Theme";
        loadBtn.addEventListener("click", () => {
            this._showThemeLoader(container);
        });

        controls.append(openFolderBtn, loadBtn);
        container.appendChild(controls);

        // Theme list
        const themes = ThemeManager.getAll();
        if (themes.length === 0) {
            const empty = document.createElement("div");
            empty.className = "veyra-empty-state";
            empty.innerHTML = `
                <div class="veyra-empty-icon">
                    <svg viewBox="0 0 24 24" width="64" height="64" fill="#C4A265">
                        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1.01 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
                    </svg>
                </div>
                <h3>No Additional Themes</h3>
                <p>Place theme CSS files in the themes folder or load one with the button above.</p>
            `;
            container.appendChild(empty);
        } else {
            const list = document.createElement("div");
            list.className = "veyra-addon-list";

            for (const theme of themes) {
                list.appendChild(this._createAddonCard(theme, "theme"));
            }

            container.appendChild(list);
        }

        return container;
    },

    /**
     * Render Custom CSS panel
     */
    renderCustomCSS() {
        const container = document.createElement("div");
        container.className = "veyra-settings-panel";

        container.appendChild(this._createSectionHeader(
            "Custom CSS",
            "Write your own CSS to customize Discord"
        ));

        const editor = CustomCSS.createEditorPanel();
        container.appendChild(editor);

        return container;
    },

    /* ===== Helper Methods ===== */

    _createSectionHeader(title, subtitle) {
        const header = document.createElement("div");
        header.className = "veyra-section-header";
        header.innerHTML = `
            <h2 class="veyra-section-title">${title}</h2>
            <p class="veyra-section-subtitle">${subtitle}</p>
        `;
        return header;
    },

    _createSettingsGroup(title, settings) {
        const group = document.createElement("div");
        group.className = "veyra-settings-group";

        const groupTitle = document.createElement("h3");
        groupTitle.className = "veyra-group-title";
        groupTitle.textContent = title;
        group.appendChild(groupTitle);

        for (const setting of settings) {
            group.appendChild(this._createToggleSetting(setting));
        }

        return group;
    },

    _createToggleSetting({ key, label, description, category }) {
        const item = document.createElement("div");
        item.className = "veyra-setting-item";

        const info = document.createElement("div");
        info.className = "veyra-setting-info";

        const labelEl = document.createElement("div");
        labelEl.className = "veyra-setting-label";
        labelEl.textContent = label;

        const descEl = document.createElement("div");
        descEl.className = "veyra-setting-description";
        descEl.textContent = description;

        info.append(labelEl, descEl);

        // Toggle switch
        const toggle = document.createElement("label");
        toggle.className = "veyra-switch";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = SettingsManager.get(category, key) || false;
        input.addEventListener("change", () => {
            SettingsManager.set(category, key, input.checked);
        });

        const slider = document.createElement("span");
        slider.className = "veyra-switch-slider";

        toggle.append(input, slider);
        item.append(info, toggle);

        return item;
    },

    _createAddonCard(addon, type) {
        const card = document.createElement("div");
        card.className = "veyra-addon-card";

        const header = document.createElement("div");
        header.className = "veyra-addon-header";

        const titleRow = document.createElement("div");
        titleRow.className = "veyra-addon-title-row";

        const name = document.createElement("span");
        name.className = "veyra-addon-name";
        name.textContent = addon.name;

        const version = document.createElement("span");
        version.className = "veyra-addon-version";
        version.textContent = `v${addon.version}`;

        const author = document.createElement("span");
        author.className = "veyra-addon-author";
        author.textContent = `by ${addon.author}`;

        titleRow.append(name, version, author);

        // Toggle
        const toggle = document.createElement("label");
        toggle.className = "veyra-switch";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = type === "plugin" ? PluginManager.isEnabled(addon.name) : ThemeManager.isEnabled(addon.name);
        input.addEventListener("change", () => {
            if (type === "plugin") {
                PluginManager.toggle(addon.name);
            } else {
                ThemeManager.toggle(addon.name);
            }
        });

        const slider = document.createElement("span");
        slider.className = "veyra-switch-slider";
        toggle.append(input, slider);

        header.append(titleRow, toggle);

        const desc = document.createElement("div");
        desc.className = "veyra-addon-description";
        desc.textContent = addon.description;

        // Footer with actions
        const footer = document.createElement("div");
        footer.className = "veyra-addon-footer";

        if (type === "plugin") {
            const settingsBtn = document.createElement("button");
            settingsBtn.className = "veyra-btn veyra-btn-sm veyra-btn-secondary";
            settingsBtn.textContent = "Settings";
            settingsBtn.addEventListener("click", () => {
                const panel = PluginManager.getSettingsPanel(addon.name);
                if (panel) {
                    this._showAddonSettings(addon.name, panel);
                }
            });

            const reloadBtn = document.createElement("button");
            reloadBtn.className = "veyra-btn veyra-btn-sm veyra-btn-secondary";
            reloadBtn.textContent = "Reload";
            reloadBtn.addEventListener("click", () => {
                PluginManager.reload(addon.name);
            });

            footer.append(settingsBtn, reloadBtn);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "veyra-btn veyra-btn-sm veyra-btn-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
            if (confirm(`Are you sure you want to delete ${addon.name}?`)) {
                if (type === "plugin") {
                    PluginManager.unregister(addon.name);
                } else {
                    ThemeManager.unregister(addon.name);
                }
                card.remove();
            }
        });

        footer.appendChild(deleteBtn);
        card.append(header, desc, footer);

        return card;
    },

    _createAboutSection() {
        const about = document.createElement("div");
        about.className = "veyra-about-section";
        about.innerHTML = `
            <div class="veyra-about-logo">
                <img src="${veyraLogoDataUri}" width="80" height="80" alt="Veyra" style="object-fit:contain;" />
            </div>
            <h3 class="veyra-about-title">Veyra</h3>
            <p class="veyra-about-version">Version ${Config.version}</p>
            <p class="veyra-about-desc">Enhanced Discord Experience — Custom themes, plugins, and more.</p>
            <p class="veyra-about-fork">Fork of <a href="https://github.com/BetterDiscord/BetterDiscord" target="_blank">BetterDiscord</a> — extended with Command Palette, Snippet Manager, Theme Profiles, Performance Monitor & BetterDiscord plugin compatibility.</p>
            <div class="veyra-about-links">
                <a href="https://veyras.dev" target="_blank" class="veyra-btn veyra-btn-primary">Website</a>
                <a href="https://github.com/BetterDiscord/BetterDiscord" target="_blank" class="veyra-btn veyra-btn-secondary">Original Project</a>
            </div>
        `;
        return about;
    },

    _showPluginLoader(container) {
        const modal = document.createElement("div");
        modal.className = "veyra-inline-modal";
        modal.innerHTML = `
            <h3>Load Plugin</h3>
            <p>Paste plugin code below:</p>
            <textarea class="veyra-css-editor-textarea" rows="10" placeholder="// Plugin code here..."></textarea>
            <div class="veyra-inline-modal-actions">
                <button class="veyra-btn veyra-btn-primary veyra-load-btn">Load</button>
                <button class="veyra-btn veyra-btn-secondary veyra-cancel-btn">Cancel</button>
            </div>
        `;

        modal.querySelector(".veyra-load-btn").addEventListener("click", () => {
            const code = modal.querySelector("textarea").value;
            if (code.trim()) {
                const name = PluginManager.loadFromString(code);
                if (name) {
                    // Re-render
                    container.innerHTML = "";
                    container.appendChild(this.renderPlugins());
                }
            }
            modal.remove();
        });

        modal.querySelector(".veyra-cancel-btn").addEventListener("click", () => {
            modal.remove();
        });

        container.appendChild(modal);
    },

    _showThemeLoader(container) {
        const modal = document.createElement("div");
        modal.className = "veyra-inline-modal";
        modal.innerHTML = `
            <h3>Load Theme</h3>
            <p>Paste theme CSS below:</p>
            <textarea class="veyra-css-editor-textarea" rows="10" placeholder="/* Theme CSS here... */"></textarea>
            <div class="veyra-inline-modal-actions">
                <button class="veyra-btn veyra-btn-primary veyra-load-btn">Load</button>
                <button class="veyra-btn veyra-btn-secondary veyra-cancel-btn">Cancel</button>
            </div>
        `;

        modal.querySelector(".veyra-load-btn").addEventListener("click", () => {
            const css = modal.querySelector("textarea").value;
            if (css.trim()) {
                const name = ThemeManager.loadFromFile(css);
                if (name) {
                    container.innerHTML = "";
                    container.appendChild(this.renderThemes());
                }
            }
            modal.remove();
        });

        modal.querySelector(".veyra-cancel-btn").addEventListener("click", () => {
            modal.remove();
        });

        container.appendChild(modal);
    },

    _showAddonSettings(name, panel) {
        const overlay = document.createElement("div");
        overlay.className = "veyra-addon-settings-overlay";
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
        });

        const modal = document.createElement("div");
        modal.className = "veyra-addon-settings-modal";

        const header = document.createElement("div");
        header.className = "veyra-addon-settings-header";
        header.innerHTML = `<h3>${name} Settings</h3>`;

        const closeBtn = document.createElement("button");
        closeBtn.className = "veyra-modal-close";
        closeBtn.textContent = "✕";
        closeBtn.addEventListener("click", () => overlay.remove());
        header.appendChild(closeBtn);

        const content = document.createElement("div");
        content.className = "veyra-addon-settings-content";

        if (typeof panel === "string") {
            content.innerHTML = panel;
        } else if (panel instanceof HTMLElement) {
            content.appendChild(panel);
        }

        modal.append(header, content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
};

export default SettingsPanel;
