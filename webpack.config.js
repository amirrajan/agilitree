var webpack = require('webpack');

module.exports = {
  entry: './client/app.js',
  output: {
    path: __dirname,
    filename: './public/scripts/bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: { presets: ['es2015', 'react'] },
      },
      {
        loader: 'babel-loader',
        test: /\.js$/,
        query: { presets: 'es2015' },
      }
    ]
  },
  plugins: [ new webpack.NoErrorsPlugin() ],
  stats: { colors: true },
  devtool: 'source-map',
};
