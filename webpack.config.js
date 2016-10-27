const webpack = require('webpack');
const path = require('path');

module.exports = function (env) {
  const isProduction = env === 'prod';
  const base = {
    entry: {
      vanilla: [path.resolve(__dirname, 'src/index.ts')],
      react: [path.resolve(__dirname, 'src/react/index.tsx')]
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
      }]
    },
    resolve: {
      extensions: ['.webpack.js', '.web.js', '.js', '.ts', '.tsx'],

      modules: [path.resolve(__dirname, 'src'), 'node_modules']
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM'
    }, plugins: [],
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
