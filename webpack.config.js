const path = require("path");

module.exports = {
    entry: "./src/core/index.js",
    target: "web",
    output: {
        filename: "veyra.js",
        path: path.resolve(__dirname, "dist"),
        library: {
            name: "Veyra",
            type: "var",
            export: "default"
        },
        // Wrap in IIFE so it executes when injected via executeJavaScript
        iife: true
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.svg$/,
                type: "asset/source"
            },
            {
                test: /\.png$/,
                type: "asset/inline"
            }
        ]
    },
    resolve: {
        alias: {
            "@core": path.resolve(__dirname, "src/core"),
            "@modules": path.resolve(__dirname, "src/modules"),
            "@ui": path.resolve(__dirname, "src/ui"),
            "@styles": path.resolve(__dirname, "src/styles"),
            "@api": path.resolve(__dirname, "src/api"),
            "@utils": path.resolve(__dirname, "src/utils")
        }
    },
    devtool: "source-map"
};
