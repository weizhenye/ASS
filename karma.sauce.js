const fs = require('fs');
const csso = require('csso');
const buble = require('rollup-plugin-buble');
const istanbul = require('rollup-plugin-istanbul');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');

const customLaunchers = {
  SL_iOS_Safari_latest: {
    base: 'SauceLabs',
    browserName: 'iphone',
    version: '11.0',
  },
  SL_iOS_Safari_oldest: {
    base: 'SauceLabs',
    browserName: 'iphone',
    version: '8.4',
  },
  SL_Android_latest: {
    base: 'SauceLabs',
    deviceName: 'Android GoogleAPI Emulator',
    platformName: 'Android',
    platformVersion: '7.1',
    browserName: 'Chrome',
    appiumVersion: '1.6.5',
  },
  SL_Android_oldest: {
    base: 'SauceLabs',
    browserName: 'android',
    version: '4.4',
  },
  SL_Chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 10',
  },
  SL_Firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
  },
  SL_Safari: {
    base: 'SauceLabs',
    browserName: 'safari',
    platform: 'macOS 10.12',
  },
  SL_Edge: {
    base: 'SauceLabs',
    browserName: 'MicrosoftEdge',
    platform: 'Windows 10',
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
      'test/test.js',
    ],
    preprocessors: {
      'test/test.js': ['rollup'],
    },
    rollupPreprocessor: {
      output: {
        format: 'iife',
      },
      plugins: [
        replace({
          __GLOBAL_CSS__: csso.minify(fs.readFileSync('./src/global.css')).css,
        }),
        resolve(),
        istanbul({
          include: ['src/**/*'],
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
