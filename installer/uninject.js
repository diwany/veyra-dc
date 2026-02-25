/**
 * Veyra Uninjector — Removes Veyra from Discord
 *
 * Usage:  node installer/uninject.js
 */

const fs = require("fs");
const path = require("path");

function findDiscordResourcePaths() {
    const platform = process.platform;
    const candidates = [];

    if (platform === "win32") {
        const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, "AppData", "Local");
        for (const channel of ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"]) {
            const base = path.join(localAppData, channel);
            if (fs.existsSync(base)) {
                const appDirs = fs.readdirSync(base).filter(d => d.startsWith("app-")).sort().reverse();
                if (appDirs.length > 0) {
                    const resourcesDir = path.join(base, appDirs[0], "resources");
                    if (fs.existsSync(resourcesDir)) {
                        candidates.push({ channel, resourcesDir });
                    }
                }
            }
        }
    } else if (platform === "darwin") {
        for (const channel of ["Discord", "DiscordPTB", "DiscordCanary"]) {
            const appPath = path.join("/Applications", `${channel}.app`, "Contents", "Resources");
            if (fs.existsSync(appPath)) {
                candidates.push({ channel, resourcesDir: appPath });
            }
        }
    } else {
        const possiblePaths = [
            "/usr/share/discord/resources",
            "/usr/lib/discord/resources",
            "/opt/discord/resources",
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                candidates.push({ channel: "Discord", resourcesDir: p });
                break;
            }
        }
    }

    return candidates;
}

function uninject(resourcesDir) {
    const appDir = path.join(resourcesDir, "app");
    const asarPath = path.join(resourcesDir, "app.asar");
    const renamedAsarPath = path.join(resourcesDir, "_app.asar");
    let cleaned = false;

    // Remove app/ folder shim
    if (fs.existsSync(appDir)) {
        const indexPath = path.join(appDir, "index.js");
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, "utf8");
            if (content.includes("Veyra")) {
                fs.rmSync(appDir, { recursive: true, force: true });
                console.log(`    ✓ Removed Veyra app/ folder override`);
                cleaned = true;
            } else {
                console.log(`    – app/ folder exists but doesn't appear to be Veyra`);
            }
        }
    }

    // Restore _app.asar back to app.asar
    if (fs.existsSync(renamedAsarPath) && !fs.existsSync(asarPath)) {
        fs.renameSync(renamedAsarPath, asarPath);
        console.log(`    ✓ Restored _app.asar → app.asar`);
        cleaned = true;
    }

    // Also clean up old injection method (discord_desktop_core)
    const oldCorePath = path.join(resourcesDir, "..", "modules", "discord_desktop_core-1", "discord_desktop_core");
    const oldBackup = path.join(oldCorePath, "index.js.veyra-backup");
    if (fs.existsSync(oldBackup)) {
        fs.copyFileSync(oldBackup, path.join(oldCorePath, "index.js"));
        fs.unlinkSync(oldBackup);
        console.log(`    ✓ Restored original discord_desktop_core/index.js`);
        cleaned = true;
    }

    if (!cleaned) {
        console.log(`    – Veyra does not appear to be injected here`);
    }
    return cleaned;
}

function main() {
    console.log("");
    console.log("  ╔══════════════════════════════════════╗");
    console.log("  ║       Veyra Uninstaller v1.0.0       ║");
    console.log("  ╚══════════════════════════════════════╝");
    console.log("");

    const discordPaths = findDiscordResourcePaths();

    if (discordPaths.length === 0) {
        console.error("  ✗ No Discord installation found!");
        process.exit(1);
    }

    for (const { channel, resourcesDir } of discordPaths) {
        console.log(`  → ${channel}`);
        console.log(`    ${resourcesDir}`);
        uninject(resourcesDir);
        console.log("");
    }

    console.log("  Done! Restart Discord to complete the removal.");
    console.log("");
}

main();
