const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    vanilla: ['./src/index.js'],
    react: ['./src/react/index.jsx']
  },
  output: {
    path: require('path').resolve('build'),
    publicPath: '/',
    filename: '[name].js',
    library: 'umd',
    libraryName: ['datavisyn','CanvasScatterplot']
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel'
    }]
  }
};
