const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: {
    main: './src/scripts/app/app.jsx'
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve('./dist'),
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
    }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: 'src/index.html'
    }),
    new CleanWebpackPlugin(),
  ]
}
