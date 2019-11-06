const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

const compRegBase = 'http://localhost:85/ds/ComponentRegistry';

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    host: 'localhost',
    port: 3000,
    open: true,
    contentBase: path.join(__dirname, 'dist'),
    proxy: {
      '/rest': compRegBase,
      '/ccr': compRegBase,
      '/vocabulary': compRegBase
    },
  }
})
