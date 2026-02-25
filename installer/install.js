/**
 * Veyra Full Installer — Build + Inject in one step
 *
 * Usage:  npm run install-veyra
 */

const { execSync } = require("child_process");
const path = require("path");

console.log("");
console.log("  ╔══════════════════════════════════════╗");
console.log("  ║     Veyra Full Installer v1.0.0      ║");
console.log("  ║  Build → Inject → Ready              ║");
console.log("  ╚══════════════════════════════════════╝");
console.log("");

// Step 1: Build
console.log("  [1/2] Building Veyra...");
try {
    execSync("npm run build", {
        cwd: path.resolve(__dirname, ".."),
        stdio: "inherit"
    });
    console.log("  ✓ Build complete\n");
} catch (e) {
    console.error("  ✗ Build failed!");
    process.exit(1);
}

// Step 2: Inject
console.log("  [2/2] Injecting into Discord...\n");
try {
    require("./inject");
} catch (e) {
    console.error("  ✗ Injection failed:", e.message);
    process.exit(1);
}
