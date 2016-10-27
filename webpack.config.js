const path = require('path');

module.exports = {
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
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'build')
  },
  devtool: 'source-map'
};
