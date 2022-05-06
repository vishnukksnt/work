'use strict';

module.exports = {
  getList: function getList() {
    var controllerRoot = 'rover/controllers/',
        jsAssets = {
      minifiedFiles: [],
      nonMinifiedFiles: [controllerRoot + "allowances/**/*.js",
      // Eliminate all spec files
      '!**/*.spec.js']
    };
    return jsAssets;
  }
};