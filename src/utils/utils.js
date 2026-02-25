/**
 * Veyra Utility Functions
 */

const Utils = {
    /**
     * Generate a unique ID
     */
    generateId() {
        return "veyra-" + Math.random().toString(36).substring(2, 9);
    },

    /**
     * Deep clone an object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        const clone = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clone[key] = this.deepClone(obj[key]);
            }
        }
        return clone;
    },

    /**
     * Deep merge objects
     */
    deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        return this.deepMerge(target, ...sources);
    },

    /**
     * Check if value is a plain object
     */
    isObject(item) {
        return item && typeof item === "object" && !Array.isArray(item);
    },

    /**
     * Debounce a function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle a function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Wait for a DOM element
     */
    waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) return resolve(element);

            const observer = new MutationObserver((mutations, obs) => {
                const el = document.querySelector(selector);
                if (el) {
                    obs.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            if (timeout > 0) {
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }, timeout);
            }
        });
    },

    /**
     * Create a DOM element with attributes and children
     */
    createElement(tag, attrs = {}, ...children) {
        const element = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (key === "className") {
                element.className = value;
            } else if (key === "style" && typeof value === "object") {
                Object.assign(element.style, value);
            } else if (key.startsWith("on") && typeof value === "function") {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else if (key === "innerHTML") {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        for (const child of children.flat()) {
            if (typeof child === "string") {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        }
        return element;
    },

    /**
     * Escape HTML entities
     */
    escapeHTML(str) {
        const div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    },

    /**
     * Show a toast notification
     */
    showToast(message, options = {}) {
        const {
            type = "info",       // success, info, warning, error
            duration = 3000,
            icon = true
        } = options;

        const toast = this.createElement("div", {
            className: `veyra-toast veyra-toast-${type}`,
            style: {
                animation: "veyra-toast-in 0.3s ease"
            }
        });

        if (icon) {
            const iconEl = this.createElement("div", { className: "veyra-toast-icon" });
            toast.appendChild(iconEl);
        }

        const content = this.createElement("div", {
            className: "veyra-toast-content"
        }, message);
        toast.appendChild(content);

        let container = document.querySelector(".veyra-toasts");
        if (!container) {
            container = this.createElement("div", { className: "veyra-toasts" });
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "veyra-toast-out 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Find React internal instance on a DOM element
     */
    getReactInstance(element) {
        if (!element) return null;
        const key = Object.keys(element).find(k =>
            k.startsWith("__reactInternalInstance") ||
            k.startsWith("__reactFiber")
        );
        return key ? element[key] : null;
    },

    /**
     * Find a React component owner from a DOM element
     */
    getOwnerInstance(element) {
        let fiber = this.getReactInstance(element);
        if (!fiber) return null;
        let current = fiber;
        while (current) {
            if (current.stateNode && !(current.stateNode instanceof HTMLElement)) {
                return current.stateNode;
            }
            current = current.return;
        }
        return null;
    },

    /**
     * Suppress Discord console warnings
     */
    suppressErrors(method, message) {
        return (...params) => {
            try {
                return method(...params);
            } catch (e) {
                Logger.error("SuppressedError", message, e);
            }
        };
    }
};

export default Utils;
