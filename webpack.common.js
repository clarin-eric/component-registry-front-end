const webpack = require('webpack');
const pkg = require('./package.json');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    main: './src/scripts/app/app.jsx'
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve('dist'),
  },
  externals: {
    "jquery": "jQuery",
    "jsonix": "Jsonix"
  },
  module: {
    rules: [
        {
            test: /\.jsx$/,
            use: [
            {
              loader: 'jsx-loader',
              options: 'harmony'
            }]
        }, {
            test: /\.js$/,
            exclude: ['/node_modules'],
            use: [{ loader: 'babel-loader' }],
        }, {
            test: require.resolve('jquery'),
            use: [
                {
                    loader: 'expose-loader',
                    options: 'jQuery'
                }, {
                    loader: 'expose-loader',
                    options: '$'
                }
            ]
        }, {
            test: /\.css$/,
            use: [
              { loader: 'style-loader'},
              { loader: 'css-loader'}
            ]
        }, {
            test: /\.s(a|c)ss$/,
            use: [
              { loader: 'style-loader'},
              { loader: 'css-loader'},
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: true,
                  indentedSyntax: false,
                  outputStyle: 'expanded'
                }
              }
            ]
        }, {
            test: /\.(png|jpg)$/,
            use: [
              {
                  loader: 'url-loader',
                  options: {
                      limit: 8192
                  }
              }
            ]
//         }, {
//             test: /\.js$/,
//             exclude: /node_modules/,
//             loader: 'eslint-loader',
//             options: {
//               emitError: false,
//               emitWarning: false
//             }
        }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: 'src/index.html'
    }),
    new CopyWebpackPlugin([
        {from: 'src/libjs', to: 'libjs'},
        {from: 'src/images', to: 'images'},
        {from: 'src/compRegConfig.jsp' }
    ]),
    new webpack.DefinePlugin({
      __FRONT_END_VERSION__: JSON.stringify(pkg.version)
    }),
    new CleanWebpackPlugin()
  ]
}
