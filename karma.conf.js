var path = require('path');

var webpack_config = require('./webpack.config.js')('dev');
delete webpack_config.entry;
delete webpack_config.external;

// Set node environment to testing
process.env.NODE_ENV = 'test';

module.exports = function (config) {
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
    failOnEmptyTestSuite: false,
    webpack: webpack_config,
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
