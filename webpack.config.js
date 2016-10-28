const webpack = require('webpack');
const path = require('path');

const pkg = require('./package.json');
const year = (new Date()).getFullYear();
const banner = '/*! ' + (pkg.title || pkg.name) + ' - v' + pkg.version + ' - ' + year + '\n' +
  (pkg.homepage ? '* ' + pkg.homepage + '\n' : '') +
  '* Copyright (c) ' + year + ' ' + pkg.author.name + ';' +
  ' Licensed ' + pkg.license + '*/\n';

module.exports = function (env) {
  const isProduction = env === 'prod';
  const base = {
    entry: {
      scatterplot: [path.resolve(__dirname, 'src/index.tsx')]
    },
    output: {
      path: path.resolve(__dirname, 'build'),
      publicPath: '/',
      filename: '[name].js',
      libraryTarget: 'umd',
      library: ['datavisyn', 'scatterplot']
    },
    module: {
      loaders: [{
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        include: path.resolve(__dirname, 'src')
      }, {
        test: /\.scss$/,
        loader: 'style!css!sass'
      }]
    },
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.js', '.ts', '.tsx'],

      modules: [path.resolve(__dirname, 'src'), 'node_modules']
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM'
    },
    plugins: [
      new webpack.BannerPlugin({
        banner: banner,
        raw: true
      })
    ],
    devServer: {
      contentBase: path.resolve(__dirname, 'build')
    },
    devtool: isProduction ? 'hidden-source-map' : 'source-map'
  };
  if (isProduction) {
    base.plugins.push(
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        },
        output: {
          comments: false
        },
        sourceMap: false
      }));
  }
  return base;
};
