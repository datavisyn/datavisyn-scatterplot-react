const path = require('path');

module.exports = {
  entry: {
    vanilla: [path.resolve(__dirname, 'src/index.js')],
    react: [path.resolve(__dirname, 'src/react/index.jsx')]
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
    filename: '[name].js',
    libraryTarget: 'umd',
    library: ['datavisyn', 'CanvasScatterplot']
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loader: 'babel',
      include: path.resolve(__dirname, 'src')
    }]
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  devtool: 'source-map'
};
