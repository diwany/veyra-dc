/**
 * Veyra Snippet Manager — One-click CSS snippet library
 * Unique Veyra feature: Pre-built CSS snippets with instant toggle
 */

import Logger from "../utils/logger";
import DataStore from "../modules/datastore";
import DOMManager from "../modules/dommanager";

const SnippetManager = {
    _snippets: new Map(),
    _enabled: new Set(),

    initialize() {
        const savedEnabled = DataStore.load("snippets", "enabled") || [];
        for (const id of savedEnabled) this._enabled.add(id);

        this._registerBuiltinSnippets();

        // Apply previously enabled snippets
        for (const id of this._enabled) {
            const snippet = this._snippets.get(id);
            if (snippet) DOMManager.injectStyle(`snippet-${id}`, snippet.css);
        }

        window.VeyraSnippetManager = this;
        Logger.log("SnippetManager", `Loaded ${this._snippets.size} snippets`);
    },

    _registerBuiltinSnippets() {
        this.register({
            id: "hide-gift-button",
            name: "Hide Gift Button",
            description: "Removes the Nitro gift button from chat",
            category: "Cleanup",
            css: `
                [aria-label*="gift" i], [aria-label*="Gift"],
                [class*="buttons"] [class*="gift"],
                button[aria-label*="gift" i] { display: none !important; }
            `
        });

        this.register({
            id: "hide-gif-button",
            name: "Hide GIF Button",
            description: "Removes the GIF button from chat",
            category: "Cleanup",
            css: `
                [aria-label*="GIF"], [aria-label="Open GIF picker"],
                [class*="buttons"] [class*="gif"],
                button[aria-label*="GIF"] { display: none !important; }
            `
        });

        this.register({
            id: "hide-sticker-button",
            name: "Hide Sticker Button",
            description: "Removes the Sticker button from chat",
            category: "Cleanup",
            css: `
                [aria-label*="sticker" i], [aria-label*="Sticker"],
                [class*="buttons"] [class*="sticker"],
                button[aria-label*="sticker" i] { display: none !important; }
            `
        });

        this.register({
            id: "compact-mode",
            name: "Ultra Compact Mode",
            description: "Reduces padding and spacing throughout Discord",
            category: "Layout",
            css: `
                [class*="message"] { padding-top: 2px !important; padding-bottom: 2px !important; }
                [class*="groupStart"] { margin-top: 8px !important; }
                [class*="channelName"] { font-size: 14px !important; }
                [class*="sidebar"] [class*="channel"] { padding: 1px 8px !important; max-height: 28px !important; }
            `
        });

        this.register({
            id: "rounded-avatars",
            name: "Square Avatars",
            description: "Makes all avatars square instead of round",
            category: "Appearance",
            css: `
                [class*="avatar"] img, [class*="avatar"] [class*="wrapper"],
                [class*="avatar"] foreignObject { border-radius: 4px !important; }
            `
        });

        this.register({
            id: "hide-user-panel-buttons",
            name: "Minimal User Panel",
            description: "Hides mute/deafen buttons from the bottom user panel",
            category: "Cleanup",
            css: `
                [class*="panels"] [class*="actionButtons"],
                [aria-label*="Mute"], [aria-label*="Deafen"] { display: none !important; }
            `
        });

        this.register({
            id: "smooth-scrolling",
            name: "Smooth Scrolling",
            description: "Enables smooth scrolling throughout Discord",
            category: "Behavior",
            css: `* { scroll-behavior: smooth !important; }`
        });

        this.register({
            id: "veyra-links",
            name: "Veyra Gold Links",
            description: "Makes all links use the Veyra gold color",
            category: "Appearance",
            css: `
                a, [class*="anchor"] { color: #C4A265 !important; }
                a:hover, [class*="anchor"]:hover { color: #D4B87A !important; }
            `
        });

        this.register({
            id: "hide-nitro-upsells",
            name: "Hide Nitro Upsells",
            description: "Hides Nitro upsell banners and promotions",
            category: "Cleanup",
            css: `
                [class*="upsell"], [class*="premiumPromo"], [class*="nitroUpsell"],
                [class*="premiumFeatureBorder"], [class*="tierBody"] { display: none !important; }
            `
        });

        this.register({
            id: "better-code-blocks",
            name: "Enhanced Code Blocks",
            description: "Bigger, more readable code blocks with Veyra styling",
            category: "Appearance",
            css: `
                [class*="markup"] code {
                    background: #1A1A1A !important;
                    border: 1px solid rgba(196,162,101,0.15) !important;
                    border-radius: 4px !important;
                    padding: 2px 6px !important;
                    color: #D4B87A !important;
                }
                [class*="markup"] pre {
                    background: #111111 !important;
                    border: 1px solid rgba(196,162,101,0.15) !important;
                    border-radius: 8px !important;
                    max-width: 90% !important;
                }
                [class*="markup"] pre code {
                    border: none !important;
                    color: #DCDDDE !important;
                }
            `
        });

        this.register({
            id: "animated-hover",
            name: "Animated Message Hover",
            description: "Adds a smooth hover effect to messages",
            category: "Appearance",
            css: `
                [class*="message"][class*="cozy"] {
                    transition: background 0.2s ease, border-left 0.2s ease !important;
                    border-left: 2px solid transparent !important;
                }
                [class*="message"][class*="cozy"]:hover {
                    background: rgba(196,162,101,0.04) !important;
                    border-left-color: rgba(196,162,101,0.3) !important;
                }
            `
        });
    },

    /**
     * Register a new snippet
     */
    register(snippet) {
        if (!snippet.id || !snippet.name || !snippet.css) return false;
        this._snippets.set(snippet.id, {
            ...snippet,
            enabled: this._enabled.has(snippet.id)
        });
        return true;
    },

    /**
     * Toggle a snippet on/off
     */
    toggle(id) {
        return this.isEnabled(id) ? this.disable(id) : this.enable(id);
    },

    enable(id) {
        const snippet = this._snippets.get(id);
        if (!snippet) return false;
        DOMManager.injectStyle(`snippet-${id}`, snippet.css);
        snippet.enabled = true;
        this._enabled.add(id);
        this._saveState();
        return true;
    },

    disable(id) {
        const snippet = this._snippets.get(id);
        if (!snippet) return false;
        DOMManager.removeStyle(`snippet-${id}`);
        snippet.enabled = false;
        this._enabled.delete(id);
        this._saveState();
        return true;
    },

    isEnabled(id) {
        return this._enabled.has(id);
    },

    getAll() {
        return Array.from(this._snippets.values());
    },

    getByCategory() {
        const categories = {};
        for (const snippet of this._snippets.values()) {
            const cat = snippet.category || "Other";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(snippet);
        }
        return categories;
    },

    _saveState() {
        DataStore.save("snippets", "enabled", Array.from(this._enabled));
    },

    /**
     * Create the snippet manager panel UI
     */
    createPanel() {
        const container = document.createElement("div");
        container.className = "veyra-settings-panel";

        // Header
        const header = document.createElement("div");
        header.className = "veyra-section-header";
        header.innerHTML = `
            <h2 class="veyra-section-title">Snippet Manager</h2>
            <p class="veyra-section-subtitle">One-click CSS tweaks — no theme editing required</p>
        `;
        container.appendChild(header);

        // Render by category
        const categories = this.getByCategory();
        for (const [catName, snippets] of Object.entries(categories)) {
            const group = document.createElement("div");
            group.className = "veyra-settings-group";

            const title = document.createElement("h3");
            title.className = "veyra-group-title";
            title.textContent = catName;
            group.appendChild(title);

            for (const snippet of snippets) {
                const item = document.createElement("div");
                item.className = "veyra-setting-item";

                const info = document.createElement("div");
                info.className = "veyra-setting-info";
                info.innerHTML = `
                    <div class="veyra-setting-label">${snippet.name}</div>
                    <div class="veyra-setting-description">${snippet.description}</div>
                `;

                const toggle = document.createElement("label");
                toggle.className = "veyra-switch";
                const input = document.createElement("input");
                input.type = "checkbox";
                input.checked = snippet.enabled;
                input.addEventListener("change", () => this.toggle(snippet.id));
                const slider = document.createElement("span");
                slider.className = "veyra-switch-slider";
                toggle.append(input, slider);

                item.append(info, toggle);
                group.appendChild(item);
            }

            container.appendChild(group);
        }

        // Custom snippet adder
        const addSection = document.createElement("div");
        addSection.className = "veyra-settings-group";
        addSection.innerHTML = `
            <h3 class="veyra-group-title">Add Custom Snippet</h3>
            <div style="display:flex;gap:8px;margin-bottom:8px;">
                <input type="text" class="veyra-quickactions-input" placeholder="Snippet name" style="flex:1;padding:8px 12px;background:var(--veyra-bg-dark);border:1px solid var(--veyra-border);border-radius:4px;color:var(--veyra-text);font-size:13px;" id="veyra-snippet-name">
            </div>
            <textarea class="veyra-css-editor-textarea" rows="4" placeholder="/* CSS here */" id="veyra-snippet-css" style="min-height:100px;"></textarea>
            <button class="veyra-btn veyra-btn-primary" style="margin-top:8px;" id="veyra-snippet-add">Add Snippet</button>
        `;
        container.appendChild(addSection);

        // Bind add button after DOM insert
        setTimeout(() => {
            const addBtn = document.getElementById("veyra-snippet-add");
            if (addBtn) {
                addBtn.addEventListener("click", () => {
                    const name = document.getElementById("veyra-snippet-name")?.value;
                    const css = document.getElementById("veyra-snippet-css")?.value;
                    if (name && css) {
                        const id = "custom-" + name.toLowerCase().replace(/\s+/g, "-");
                        this.register({ id, name, description: "Custom snippet", category: "Custom", css });
                        this.enable(id);
                    }
                });
            }
        }, 0);

        return container;
    },

    openPanel() {
        // This will be called from QuickActions or settings
    }
};

export default SnippetManager;
