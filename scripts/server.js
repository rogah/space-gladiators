import express from 'express';
import path from 'path';
import open from 'open';
import webpack from 'webpack';

import config from '../webpack.config.dev';

/* eslint-disable no-console */

const port = 3030;
const app = express();

const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
    publicPath: config.output.publicPath,
}));

app.use(express.static(path.join(__dirname, '../assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, (err) => {
    if (err) {
        console.error(err);
    } else {
        open(`http://localhost:${port}`);
    }
});
