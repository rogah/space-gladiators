import path from 'path';

import webpack from 'webpack';

export default {
    devtool: 'source-map',
    entry: [
        path.resolve(__dirname, 'src/index'),
    ],
    target: 'web',
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: path.resolve(__dirname, '/'),
        filename: 'bundle.js',
    },
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loaders: ['babel-loader'] },
            { test: /\.css$/, loaders: ['style', 'css'] },
        ],
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
        }),
    ],
};
