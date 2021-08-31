import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import webpack from 'webpack'
import { Configuration as DevServerConfiguration } from 'webpack-dev-server'


type WebpackConfig = webpack.Configuration & { devServer?: DevServerConfiguration }


export default (_: any, options: any): WebpackConfig => {
    const HOST = process.env.HOST ?? 'localhost'
    const PORT = parseInt(process.env.PORT ?? '3000', 10)
    const hmrDisabled = process.env.NO_HMR

    const isProduction = options.mode === 'production'
    const isDevelopment = options.mode === 'development'

    const config: WebpackConfig = {}

    /*
     * -------------------------------------------------------------
     * Entry points
     * -------------------------------------------------------------
     */

    config.entry = {
        index: path.resolve(__dirname, 'src/index'),
    }

    /*
     * -------------------------------------------------------------
     * Output
     * -------------------------------------------------------------
     */

    config.output = {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name]-[contenthash:6].js',
        publicPath: '/',
        clean: true,
    }

    /*
     * -------------------------------------------------------------
     * Optimization
     * -------------------------------------------------------------
     */

    config.optimization = isDevelopment ? {
        splitChunks: {
            cacheGroups: {
                default: false,
                vendors: false,
            },
        },
    } : {
        splitChunks: {
            chunks: (chunk) => !/^(polyfills|pages|modules)$/.test(chunk.name),
            cacheGroups: {
                vendor: {
                    chunks: 'all',
                    name: 'vendors',
                    test: /(?<!node_modules.*)[\\/]node_modules[\\/]/,
                    priority: 40,
                    enforce: true,
                },
                common: {
                    name: 'commons',
                    test: /(common|layout|hooks|misc)/,
                    minChunks: 1,
                    priority: 30,
                    reuseExistingChunk: true,
                },
                default: false,
                vendors: false,
            },
            maxInitialRequests: 10,
            minSize: 30000,
        },
    }

    /*
     * -------------------------------------------------------------
     * Plugins
     * -------------------------------------------------------------
     */

    config.plugins = []

    if (isDevelopment && !hmrDisabled) {
        config.plugins.push(new webpack.HotModuleReplacementPlugin())
    }

    config.plugins.push(
        new HtmlWebpackPlugin({
            title: 'TON Swap',
            favicon: 'public/favicon.svg',
            filename: path.resolve(__dirname, 'dist/index.html'),
            template: 'public/index.html',
            inject: false,
        }),
    )

    if (isProduction) {
        config.plugins.push(
            new MiniCssExtractPlugin({
                filename: 'css/[name]-[contenthash:6].css',
                ignoreOrder: true,
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        context: 'public',
                        from: 'favicon.ico',
                    },
                    {
                        context: 'public',
                        from: 'favicon.svg',
                    },
                ],
            }),
        )
    }

    /*
     * -------------------------------------------------------------
     * Module
     * -------------------------------------------------------------
     */

    config.module = {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|jpe?g|gif|webp|svg|woff2?)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        publicPath: '/',
                        outputPath: 'assets/',
                        esModule: false,
                        name: '[hash:16].[ext]',
                    },
                },
            },
        ],
    }

    /*
     * -------------------------------------------------------------
     * Resolve
     * -------------------------------------------------------------
     */

    config.resolve = {
        alias: {
            '@': path.resolve(__dirname, 'src')
        },

        extensions: ['.js', '.jsx', '.ts', '.tsx', '.scss', '.css'],

        modules: [
            path.resolve(__dirname, 'src'),
            'node_modules',
        ],
    }

    /*
     * -------------------------------------------------------------
     * Devtool
     * -------------------------------------------------------------
     */

    if (isDevelopment) {
        config.devtool = 'inline-source-map'
    }

    /*
     * -------------------------------------------------------------
     * Dev Server
     * -------------------------------------------------------------
     */

    if (isDevelopment) {
        config.devServer = {
            host: HOST,
            port: PORT,
            contentBase: [
                path.join(__dirname + '/dist'),
            ],
            inline: hmrDisabled ? false : true,
            hot: hmrDisabled ? false : true,
            quiet: false,
            historyApiFallback: true,
            stats: {
                colors: true,
            },
        }
    }

    /*
     * -------------------------------------------------------------
     * Watch
     * -------------------------------------------------------------
     */

    if (isDevelopment) {
        config.watchOptions = {
            aggregateTimeout: 5,
            ignored: /node_modules/,
            poll: true,
        }
    }

    /*
     * -------------------------------------------------------------
     * Stats
     * -------------------------------------------------------------
     */

    config.stats = 'summary'

    return config
}
