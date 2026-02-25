/**
 * Veyra DOM Manager — Safely add/remove elements from Discord DOM
 */

import Logger from "../utils/logger";

const DOMManager = {
    _observers: [],
    _elements: new Map(),
    _styleSheets: new Map(),

    initialize() {
        Logger.log("DOMManager", "DOM Manager initialized");
    },

    /**
     * Inject a style element
     */
    injectStyle(id, css) {
        this.removeStyle(id);
        const style = document.createElement("style");
        style.id = `veyra-style-${id}`;
        style.textContent = css;
        document.head.appendChild(style);
        this._styleSheets.set(id, style);
        return style;
    },

    /**
     * Remove a style element
     */
    removeStyle(id) {
        const existing = this._styleSheets.get(id);
        if (existing) {
            existing.remove();
            this._styleSheets.delete(id);
        }
        // Also try by ID in case it wasn't tracked
        const el = document.getElementById(`veyra-style-${id}`);
        if (el) el.remove();
    },

    /**
     * Update an existing style element
     */
    updateStyle(id, css) {
        const style = this._styleSheets.get(id);
        if (style) {
            style.textContent = css;
        } else {
            this.injectStyle(id, css);
        }
    },

    /**
     * Add a DOM element tracked by Veyra
     */
    addElement(id, element, target = document.body) {
        this.removeElement(id);
        this._elements.set(id, element);
        target.appendChild(element);
        return element;
    },

    /**
     * Remove a tracked DOM element
     */
    removeElement(id) {
        const existing = this._elements.get(id);
        if (existing) {
            existing.remove();
            this._elements.delete(id);
        }
    },

    /**
     * Watch for DOM changes
     */
    observe(target, callback, options = {}) {
        const defaultOptions = {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        };

        const observer = new MutationObserver(callback);
        observer.observe(target, { ...defaultOptions, ...options });
        this._observers.push(observer);
        return observer;
    },

    /**
     * Stop observing
     */
    unobserve(observer) {
        observer.disconnect();
        const idx = this._observers.indexOf(observer);
        if (idx > -1) this._observers.splice(idx, 1);
    },

    /**
     * Wait for an element to appear in the DOM
     */
    waitFor(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const observer = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) {
                    observer.disconnect();
                    resolve(found);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            if (timeout > 0) {
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for ${selector}`));
                }, timeout);
            }
        });
    },

    /**
     * Add a class to the document body
     */
    addBodyClass(className) {
        document.body.classList.add(className);
    },

    /**
     * Remove a class from the document body
     */
    removeBodyClass(className) {
        document.body.classList.remove(className);
    },

    /**
     * Cleanup all injected elements
     */
    cleanup() {
        for (const observer of this._observers) {
            observer.disconnect();
        }
        this._observers = [];

        for (const [id] of this._elements) {
            this.removeElement(id);
        }

        for (const [id] of this._styleSheets) {
            this.removeStyle(id);
        }

        Logger.log("DOMManager", "Cleanup complete");
    }
};

export default DOMManager;
