/**
 * Veyra Configuration
 */

const Config = {
    name: "Veyra",
    version: "1.0.0",
    description: "Enhanced Discord Experience",
    website: "https://veyras.dev",

    paths: {
        plugins: "veyra/plugins",
        themes: "veyra/themes",
        data: "veyra/data",
        customCSS: "veyra/data/custom.css"
    },

    defaultSettings: {
        customCSS: {
            enabled: false,
            css: ""
        },
        general: {
            publicServers: true,
            voiceDisconnect: false,
            classNormalizer: true,
            showToasts: true,
            mediaKeys: false
        },
        appearance: {
            minimalMode: false,
            coloredText: true,
            hideGiftButton: true,
            hideGIFButton: false,
            hideStickerButton: false,
            twentyFourHourTimestamps: false
        },
        developer: {
            debugMode: false,
            devTools: true,
            inspectElement: true,
            devToolsWarning: false,
            reactDevTools: false
        }
    },

    // Veyra color palette
    colors: {
        primary: "#C4A265",        // Gold
        primaryLight: "#D4B87A",   // Light gold
        primaryDark: "#A88B4A",    // Dark gold
        secondary: "#1A1A1A",      // Dark grey
        secondaryLight: "#1D1D1D", // Grey
        background: "#111111",     // Very dark grey
        backgroundLight: "#1A1A1A",// Dark grey
        surface: "#222222",        // Card background
        surfaceLight: "#2A2A2A",   // Lighter surface
        text: "#FFFFFF",           // White text
        textMuted: "#888888",      // Muted text
        textAccent: "#C4A265",     // Gold accent text
        accent: "#C4A265",         // Accent (gold)
        success: "#43B581",        // Green
        warning: "#FAA61A",        // Orange
        danger: "#F04747",         // Red
        info: "#5865F2"            // Blurple
    }
};

export default Config;
