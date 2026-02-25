/**
 * Veyra Installer — Injects Veyra into Discord's desktop client
 * Uses the "app folder override" method: creates a resources/app/ folder
 * that Electron loads instead of app.asar, which then loads the original
 * app.asar while injecting Veyra into the renderer.
 *
 * Usage:  node installer/inject.js
 */

const fs = require("fs");
const path = require("path");

// ── Helpers ──

function findDiscordResourcePaths() {
    const platform = process.platform;
    const candidates = [];

    if (platform === "win32") {
        const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, "AppData", "Local");

        for (const channel of ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"]) {
            const base = path.join(localAppData, channel);
            if (fs.existsSync(base)) {
                const appDirs = fs.readdirSync(base)
                    .filter(d => d.startsWith("app-"))
                    .sort()
                    .reverse();

                if (appDirs.length > 0) {
                    const resourcesDir = path.join(base, appDirs[0], "resources");
                    if (fs.existsSync(path.join(resourcesDir, "app.asar")) || fs.existsSync(path.join(resourcesDir, "_app.asar"))) {
                        candidates.push({ channel, resourcesDir });
                    }
                }
            }
        }
    } else if (platform === "darwin") {
        const home = process.env.HOME;
        for (const channel of ["Discord", "DiscordPTB", "DiscordCanary"]) {
            const appPath = path.join("/Applications", `${channel}.app`, "Contents", "Resources");
            if (fs.existsSync(path.join(appPath, "app.asar"))) {
                candidates.push({ channel, resourcesDir: appPath });
            }
        }
    } else { // Linux
        const possiblePaths = [
            "/usr/share/discord/resources",
            "/usr/lib/discord/resources",
            "/opt/discord/resources",
            "/opt/Discord/resources",
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(path.join(p, "app.asar"))) {
                candidates.push({ channel: "Discord", resourcesDir: p });
                break;
            }
        }
    }

    return candidates;
}

function getVeyraDistPath() {
    return path.resolve(__dirname, "..", "dist", "veyra.js");
}

function getVeyraLogoPath() {
    return path.resolve(__dirname, "..", "assets", "Veyra_logo.png");
}

function getVeyraDataDir() {
    const appData = process.env.APPDATA || process.env.HOME;
    const dir = path.join(appData, "veyra");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function getPreloadCode() {
    return `// Veyra Preload — Bridges Node.js filesystem to the renderer
const { contextBridge, ipcRenderer } = require("electron");

try {
    contextBridge.exposeInMainWorld("VeyraNative", {
        readdir: (dir) => ipcRenderer.invoke("veyra-readdir", dir),
        readFile: (filePath) => ipcRenderer.invoke("veyra-read-file", filePath),
        writeFile: (filePath, content) => ipcRenderer.invoke("veyra-write-file", filePath, content),
        exists: (filePath) => ipcRenderer.invoke("veyra-exists", filePath),
        deleteFile: (filePath) => ipcRenderer.invoke("veyra-delete-file", filePath),
        openPath: (dirPath) => ipcRenderer.invoke("veyra-open-path", dirPath),
        getPaths: () => ipcRenderer.invoke("veyra-get-paths"),
        mkdir: (dirPath) => ipcRenderer.invoke("veyra-mkdir", dirPath),
    });
} catch(e) {
    console.error("[Veyra] Preload bridge error:", e);
}
`;
}

// ── Injection ──

function inject(resourcesDir) {
    const appDir = path.join(resourcesDir, "app");
    const veyraDistPath = getVeyraDistPath();
    const veyraLogoPath = getVeyraLogoPath();
    const veyraDataDir = getVeyraDataDir();
    const veyraTargetPath = path.join(veyraDataDir, "veyra.js");

    // Copy Veyra bundle to data directory
    if (fs.existsSync(veyraDistPath)) {
        fs.copyFileSync(veyraDistPath, veyraTargetPath);
        console.log(`  ✓ Copied veyra.js to ${veyraDataDir}`);
    } else {
        console.error(`  ✗ veyra.js not found at ${veyraDistPath}`);
        console.error(`    Run 'npm run build' first.`);
        return false;
    }

    // Read logo and base64 encode for splash screen replacement
    let logoBase64 = "";
    if (fs.existsSync(veyraLogoPath)) {
        logoBase64 = fs.readFileSync(veyraLogoPath).toString("base64");
        console.log(`  ✓ Loaded Veyra logo (${logoBase64.length} chars base64)`);
    } else {
        console.warn(`  ⚠ Veyra logo not found at ${veyraLogoPath}, splash logo replacement skipped`);
    }

    // Create plugin/theme directories
    for (const sub of ["plugins", "themes", "data"]) {
        const subDir = path.join(veyraDataDir, sub);
        if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
    }

    // Rename app.asar to _app.asar so Electron loads our app/ folder
    const asarPath = path.join(resourcesDir, "app.asar");
    const renamedAsarPath = path.join(resourcesDir, "_app.asar");
    if (fs.existsSync(asarPath)) {
        fs.renameSync(asarPath, renamedAsarPath);
        console.log(`  ✓ Renamed app.asar → _app.asar`);
    } else if (!fs.existsSync(renamedAsarPath)) {
        console.error(`  ✗ Neither app.asar nor _app.asar found!`);
        return false;
    }

    // Create the app/ folder override
    if (fs.existsSync(appDir)) {
        fs.rmSync(appDir, { recursive: true, force: true });
    }
    fs.mkdirSync(appDir, { recursive: true });

    // Write package.json — must have same "main" structure as original
    const packageJson = {
        name: "discord",
        main: "index.js",
        private: true
    };
    fs.writeFileSync(path.join(appDir, "package.json"), JSON.stringify(packageJson, null, 2), "utf8");
    console.log(`  ✓ Created app/package.json`);

    // Write preload.js — bridges Node.js APIs to the renderer via IPC
    const preloadCode = getPreloadCode();
    fs.writeFileSync(path.join(appDir, "preload.js"), preloadCode, "utf8");
    console.log(`  ✓ Created app/preload.js`);

    // Write index.js — the shim that loads original Discord + injects Veyra
    const logoDataUri = logoBase64 ? "data:image/png;base64," + logoBase64 : "";
    const indexCode = `"use strict";

// Veyra Injection Shim
// Loads the original Discord _app.asar and injects Veyra into the renderer

const path = require("path");
const fs = require("fs");
const electron = require("electron");
const { ipcMain, shell, session } = electron;

// Debug log to file
const LOG_PATH = path.join(require("os").tmpdir(), "veyra-debug.log");
function log(msg) {
    const line = "[" + new Date().toTimeString().slice(0,8) + "] " + msg + "\\n";
    try { fs.appendFileSync(LOG_PATH, line); } catch(e) {}
}

log("=== Veyra shim loaded ===");

// Paths
const VEYRA_PATH = ${JSON.stringify(veyraTargetPath)};
const VEYRA_DATA = ${JSON.stringify(veyraDataDir)};
const PRELOAD_PATH = path.join(__dirname, "preload.js");
const VEYRA_LOGO = "${logoDataUri}";

// Read Veyra bundle
let veyraCode;
try {
    veyraCode = fs.readFileSync(VEYRA_PATH, "utf8");
    log("Loaded bundle (" + veyraCode.length + " bytes)");
} catch (e) {
    log("ERROR: Failed to read veyra.js: " + e.message);
}

// Ensure data directories exist
for (const sub of ["plugins", "themes", "data"]) {
    const dir = path.join(VEYRA_DATA, sub);
    try { fs.mkdirSync(dir, { recursive: true }); } catch(e) {}
}

// === IPC Handlers for renderer filesystem access ===
ipcMain.handle("veyra-readdir", async (_, dirPath) => {
    try { return fs.readdirSync(dirPath); } catch(e) { return []; }
});
ipcMain.handle("veyra-read-file", async (_, filePath) => {
    try { return fs.readFileSync(filePath, "utf8"); } catch(e) { return null; }
});
ipcMain.handle("veyra-write-file", async (_, filePath, content) => {
    try { fs.writeFileSync(filePath, content, "utf8"); return true; } catch(e) { return false; }
});
ipcMain.handle("veyra-exists", async (_, filePath) => {
    return fs.existsSync(filePath);
});
ipcMain.handle("veyra-delete-file", async (_, filePath) => {
    try { fs.unlinkSync(filePath); return true; } catch(e) { return false; }
});
ipcMain.handle("veyra-open-path", async (_, dirPath) => {
    return shell.openPath(dirPath);
});
ipcMain.handle("veyra-get-paths", async () => {
    return {
        data: VEYRA_DATA,
        plugins: path.join(VEYRA_DATA, "plugins"),
        themes: path.join(VEYRA_DATA, "themes"),
        customCSS: path.join(VEYRA_DATA, "data", "custom.css"),
    };
});
ipcMain.handle("veyra-mkdir", async (_, dirPath) => {
    try { fs.mkdirSync(dirPath, { recursive: true }); return true; } catch(e) { return false; }
});

// === Set session preloads (must run before Discord creates windows) ===
electron.app.on("ready", () => {
    try {
        session.defaultSession.setPreloads([PRELOAD_PATH]);
        log("Session preloads set");
    } catch(e) {
        log("ERROR setting preloads: " + e.message);
    }
});

// Splash/boot logo replacement script (self-cleaning)
const splashScript = '(function(){' +
    'try{' +
    'var s=document.createElement("style");' +
    's.id="veyra-splash-style";' +
    's.textContent="' +
    'video,[class*=wordmark],[class*=Wordmark]{opacity:0!important;visibility:hidden!important}' +
    '.veyra-boot-logo{position:fixed;top:50%;left:50%;transform:translate(-50%,-60%);width:128px;height:128px;object-fit:contain;z-index:99999;pointer-events:none}' +
    '";' +
    'document.head.appendChild(s);' +
    'if("' + VEYRA_LOGO + '"){' +
    'var img=document.createElement("img");' +
    'img.className="veyra-boot-logo";' +
    'img.src="' + VEYRA_LOGO + '";' +
    '(document.body||document.documentElement).appendChild(img);' +
    '}' +
    'function cleanup(){' +
    'var logo=document.querySelector(".veyra-boot-logo");if(logo)logo.remove();' +
    'var ss=document.getElementById("veyra-splash-style");if(ss)ss.remove();' +
    'clearInterval(ci);' +
    '}' +
    'var ci=setInterval(function(){' +
    'var am=document.getElementById("app-mount");' +
    'if(am&&am.children.length>0)cleanup();' +
    '},500);' +
    'setTimeout(function(){cleanup();},10000);' +
    '}catch(e){}' +
    '})()';

// Track injected windows
const injectedWindows = new Set();

function injectIntoWindow(win) {
    if (!win || win.isDestroyed()) return;
    const id = win.id;
    if (injectedWindows.has(id)) return;
    injectedWindows.add(id);

    win.on("closed", () => injectedWindows.delete(id));

    const wc = win.webContents;
    wc.on("dom-ready", () => {
        if (win.isDestroyed()) return;
        log("dom-ready window " + id);

        wc.executeJavaScript(splashScript).catch(() => {});

        if (veyraCode) {
            wc.executeJavaScript(veyraCode)
                .then(() => log("Veyra injected into window " + id))
                .catch(e => log("Injection error: " + e.message));
        }
    });
}

electron.app.on("browser-window-created", (_, win) => {
    log("browser-window-created: " + win.id);
    injectIntoWindow(win);
});

// Load the original Discord app from _app.asar
const originalAppPath = path.join(__dirname, "..", "_app.asar");
log("Loading original Discord from " + originalAppPath);

try {
    require(originalAppPath);
    log("Original Discord loaded");
} catch(e) {
    log("ERROR loading Discord: " + e.message);
}
`;

    fs.writeFileSync(path.join(appDir, "index.js"), indexCode, "utf8");
    console.log(`  ✓ Created app/index.js (Veyra shim)`);

    return true;
}

// ── Uninject helper ──

function restoreDiscordCore(resourcesDir) {
    // Also restore old discord_desktop_core if we previously patched it
    const appDir = path.join(resourcesDir, "..", "modules", "discord_desktop_core-1", "discord_desktop_core");
    const backupPath = path.join(appDir, "index.js.veyra-backup");
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, path.join(appDir, "index.js"));
        fs.unlinkSync(backupPath);
        console.log(`  ✓ Restored original discord_desktop_core/index.js`);
    }
}

// ── Main ──

function main() {
    console.log("");
    console.log("  ╔══════════════════════════════════════╗");
    console.log("  ║        Veyra Installer v1.0.0        ║");
    console.log("  ║  Enhanced Discord Experience          ║");
    console.log("  ╚══════════════════════════════════════╝");
    console.log("");

    const discordPaths = findDiscordResourcePaths();

    if (discordPaths.length === 0) {
        console.error("  ✗ No Discord installation found!");
        console.error("    Make sure Discord is installed and has been run at least once.");
        process.exit(1);
    }

    console.log(`  Found ${discordPaths.length} Discord installation(s):\\n`);

    for (const { channel, resourcesDir } of discordPaths) {
        console.log(`  → ${channel}`);
        console.log(`    ${resourcesDir}`);

        // Clean up old injection method
        restoreDiscordCore(resourcesDir);

        const success = inject(resourcesDir);
        if (success) {
            console.log(`    ✓ Veyra injected into ${channel}\\n`);
        } else {
            console.log(`    ✗ Failed to inject into ${channel}\\n`);
        }
    }

    console.log("  Done! Restart Discord to load Veyra.");
    console.log("  Press Ctrl+Shift+P in Discord to open the Quick Actions command palette.");
    console.log("");
}

main();
