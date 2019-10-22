const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    host: 'localhost',
    port: 3000,
    open: true,
    contentBase: path.join(__dirname, 'dist')
  }
})
