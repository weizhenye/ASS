const path = require('path');
const alias = require('@rollup/plugin-alias');

// https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
const customLaunchers = {
  SL_iOS_Safari: {
    base: 'SauceLabs',
    browserName: 'Safari',
    deviceName: 'iPhone Simulator',
    platformVersion: '13.4',
    platformName: 'iOS',
  },
  // SL_Android: {
  //   base: 'SauceLabs',
  //   deviceName: 'Android Emulator',
  //   browserName: 'Chrome',
  //   platformVersion: '10.0',
  //   platformName: 'Android',
  // },
  SL_Chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
  },
  SL_Firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
  },
  SL_Safari: {
    base: 'SauceLabs',
    browserName: 'safari',
  },
  SL_Edge: {
    base: 'SauceLabs',
    browserName: 'MicrosoftEdge',
  },
};

module.exports = (config) => {
  config.set({
    singleRun: true,
    concurrency: 5,
    captureTimeout: 300000,
    browserNoActivityTimeout: 120000,
    frameworks: ['mocha', 'chai'],
    browsers: Object.keys(customLaunchers),
    customLaunchers,
    files: [
      { pattern: 'test/fixtures/**/*.*', included: false, served: true },
      { pattern: 'test/test.js', watched: false },
    ],
    preprocessors: {
      'test/test.js': ['rollup'],
    },
    rollupPreprocessor: {
      output: {
        format: 'iife',
      },
      plugins: [
        alias({
          entries: {
            '../../src/index.js': path.resolve(__dirname, './dist/ass.esm.js'),
          },
        }),
      ],
    },
    reporters: ['dots', 'saucelabs'],
    sauceLabs: {
      testName: 'ASS.js unit test',
      recordScreenshots: false,
    },
  });
};
