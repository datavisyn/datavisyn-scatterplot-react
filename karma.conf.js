var path = require('path');

// Set node environment to testing
process.env.NODE_ENV = 'test';

module.exports = function(config) {
    config.set({
        basePath: '',
        browsers: ['Firefox'],
        files: [
          'test/loadtests.js'
        ],
        port: 8000,
        captureTimeout: 60000,
        frameworks: ['mocha', 'chai'],
        client: {
          mocha: {}
        },
        singleRun: true,
        reporters: ['mocha', 'coverage'],
        preprocessors: {
          'test/loadtests.js': ['webpack']
        },
        webpack: {
          module: {
            preLoaders: [{
              test: /\.jsx?$/,
              exclude: [
                path.resolve(__dirname, 'src/'),
                path.resolve(__dirname, 'node_modules/')
              ],
              loader: 'babel'
            },{ // transpile and instrument only testing sources with isparta
                test: /\.jsx?$/,
                include: path.resolve(__dirname, 'src/'),
                loader: 'isparta'
              }]
            },
            resolve: {
              extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
            },
            devtool: 'eval'
          },
          coverageReporter: {
            dir: 'coverage/',
            reporters: [{
              type: 'html'
            }, {
              type: 'text'
            }]
          }
        });
    };
