"use strict";

module.exports = (env, argv) => {
    let loader;
    loader = {
        test: /\.(t|j)sx?$/,
        use: {
            loader: 'swc-loader',
            options: {
                jsc: {
                    "target": "es2019"
                }
            }
        },
        exclude: /node_modules/
    };
    return {
        cache: true,
        devtool: 'source-map',
        entry: {
            vscode_diff: './src/index.ts',
        },
        mode: "production",
        module: {
            rules: [
                loader
            ]
        },
        resolveLoader: {
            modules: [
                "node_modules", __dirname + "/node_modules"
            ]
        },
        resolve: {
            preferRelative: true,
            extensions: ['.tsx', '.ts', '.js']
        },
        output: {
            filename: 'bundle.[name].js',
            path: __dirname + '/build',
            publicPath: 'auto',
            library: {
                type: "umd2"
            }
        },
        optimization: {
            minimize: false
        }
    };
};
