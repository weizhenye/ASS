const path = require('path');
const alias = require('rollup-plugin-alias');
const buble = require('rollup-plugin-buble');

// https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
const customLaunchers = {
  SL_iOS_Safari_latest: {
    base: 'SauceLabs',
    browserName: 'Safari',
    deviceName: 'iPhone Simulator',
    platformVersion: '12.2',
    platformName: 'iOS',
  },
  SL_iOS_Safari_oldest: {
    base: 'SauceLabs',
    browserName: 'Safari',
    deviceName: 'iPhone Simulator',
    platformVersion: '10.3',
    platformName: 'iOS',
  },
  SL_Android_latest: {
    base: 'SauceLabs',
    deviceName: 'Android Emulator',
    browserName: 'Chrome',
    platformVersion: '8.0',
    platformName: 'Android',
  },
  // SL_Android_oldest: {
  //   base: 'SauceLabs',
  //   deviceName: 'Android Emulator',
  //   browserName: 'Browser',
  //   platformVersion: '5.1',
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
  SL_IE_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11',
  },
  SL_IE_10: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 8',
    version: '10',
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
          '../../src/index.js': path.resolve(__dirname, './dist/ass.esm.js'),
        }),
        buble(),
      ],
    },
    reporters: ['dots', 'saucelabs'],
    sauceLabs: {
      testName: 'ASS.js unit test',
      recordScreenshots: false,
    },
  });
};
