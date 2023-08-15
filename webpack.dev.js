const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

// const compRegBase = 'http://compreg-rest-1:8080';
const compRegBase = 'http://localhost:8080';

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    contentBase: path.join(__dirname, 'dist'),
    proxy: {
      '/ds/ComponentRegistry/rest': compRegBase,
      '/ds/ComponentRegistry/ccr': compRegBase,
      '/ds/ComponentRegistry/vocabulary': compRegBase
    },
    headers: {
      "Access-Control-Allow-Origin": "http://0.0.0.0:3000",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
      "Access-Control-Allow-Credentials": "true"
    },
  }
})
