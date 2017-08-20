import path from 'path';

import webpack from 'webpack';

export default {
    devtool: 'inline-source-map',
    target: 'web',
    entry: [
        path.resolve(__dirname, 'src/index'),
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: path.resolve(__dirname, '/'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
        }),
    ],
};
