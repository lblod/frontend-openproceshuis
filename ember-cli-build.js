'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    sassOptions: {
      includePaths: ['node_modules/@appuniversum/ember-appuniversum'],
    },
  });

  return app.toTree();
};
