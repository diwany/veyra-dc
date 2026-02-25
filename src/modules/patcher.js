/**
 * Veyra Patcher — Monkey-patch Discord functions
 */

import Logger from "../utils/logger";

const Patcher = {
    _patches: new Map(),

    initialize() {
        Logger.log("Patcher", "Patcher system initialized");
    },

    /**
     * Get all patches by a caller
     */
    getPatchesByCaller(caller) {
        const patches = [];
        for (const [, patchList] of this._patches) {
            for (const patch of patchList) {
                if (patch.caller === caller) patches.push(patch);
            }
        }
        return patches;
    },

    /**
     * Unpatch all patches by a caller
     */
    unpatchAll(caller) {
        if (caller) {
            const patches = this.getPatchesByCaller(caller);
            for (const patch of patches) {
                patch.unpatch();
            }
            Logger.log("Patcher", `Unpatched all patches for: ${caller}`);
        } else {
            for (const [, patchList] of this._patches) {
                for (const patch of [...patchList]) {
                    patch.unpatch();
                }
            }
            this._patches.clear();
            Logger.log("Patcher", "All patches removed");
        }
    },

    /**
     * Patch a method — run callback BEFORE the original
     */
    before(caller, module, method, callback) {
        return this._patch(caller, module, method, callback, "before");
    },

    /**
     * Patch a method — run callback AFTER the original
     */
    after(caller, module, method, callback) {
        return this._patch(caller, module, method, callback, "after");
    },

    /**
     * Patch a method — REPLACE the original entirely
     */
    instead(caller, module, method, callback) {
        return this._patch(caller, module, method, callback, "instead");
    },

    /**
     * Internal: apply a patch
     */
    _patch(caller, module, method, callback, type) {
        if (!module) {
            Logger.error("Patcher", `Cannot patch ${method}: module is undefined`);
            return () => {};
        }

        if (!module[method]) {
            Logger.error("Patcher", `Cannot patch ${method}: method does not exist`);
            return () => {};
        }

        const patchId = `${caller}.${method}.${type}`;
        const original = module[method];

        if (!this._patches.has(method)) {
            this._patches.set(method, []);
        }

        const patchInfo = {
            caller,
            type,
            method,
            module,
            callback,
            original,
            id: patchId,
            unpatch: () => {
                const list = this._patches.get(method);
                if (list) {
                    const idx = list.indexOf(patchInfo);
                    if (idx > -1) list.splice(idx, 1);
                    if (list.length === 0) {
                        module[method] = original;
                        this._patches.delete(method);
                    } else {
                        this._rebuildPatch(module, method);
                    }
                }
            }
        };

        this._patches.get(method).push(patchInfo);
        this._rebuildPatch(module, method);

        Logger.debug("Patcher", `Patched ${method} (${type}) by ${caller}`);

        return patchInfo.unpatch;
    },

    /**
     * Rebuild the patched function from all active patches
     */
    _rebuildPatch(module, method) {
        const patches = this._patches.get(method);
        if (!patches || patches.length === 0) return;

        const original = patches[0].original;
        const befores = patches.filter(p => p.type === "before");
        const afters = patches.filter(p => p.type === "after");
        const insteads = patches.filter(p => p.type === "instead");

        module[method] = function(...args) {
            let modifiedArgs = args;

            // Run before patches
            for (const patch of befores) {
                try {
                    const result = patch.callback(this, modifiedArgs);
                    if (Array.isArray(result)) modifiedArgs = result;
                } catch (e) {
                    Logger.error("Patcher", `Error in before patch ${patch.id}`, e);
                }
            }

            // Run instead patches or the original
            let returnValue;
            if (insteads.length > 0) {
                for (const patch of insteads) {
                    try {
                        returnValue = patch.callback(this, modifiedArgs, original.bind(this));
                    } catch (e) {
                        Logger.error("Patcher", `Error in instead patch ${patch.id}`, e);
                    }
                }
            } else {
                returnValue = original.apply(this, modifiedArgs);
            }

            // Run after patches
            for (const patch of afters) {
                try {
                    const result = patch.callback(this, modifiedArgs, returnValue);
                    if (result !== undefined) returnValue = result;
                } catch (e) {
                    Logger.error("Patcher", `Error in after patch ${patch.id}`, e);
                }
            }

            return returnValue;
        };

        // Preserve static properties
        Object.assign(module[method], original);
        module[method].__veyraPatched = true;
        module[method].__veyraOriginal = original;
        module[method].toString = () => original.toString();
    }
};

export default Patcher;
