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
            loaders: [{
              test: /\.tsx?$/,
              loader: 'awesome-typescript-loader',
              include: path.resolve(__dirname, 'src/'),
              loader: 'babel'
            }],
            resolve: {
              extensions: ['', '.webpack.js', '.web.js', '.js', 'ts', '.tsx']
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
