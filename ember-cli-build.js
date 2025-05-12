'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    autoImport: {
      webpack: {
        module: {
          rules: [
            {
              test: /pdf.js/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [['@babel/preset-env', { targets: 'defaults' }]],
                },
              },
            },
          ],
        },
      },
    },
    'ember-simple-auth': {
      useSessionSetupMethod: true,
    },
    sassOptions: {
      sourceMapEmbed: true,
      includePaths: ['node_modules/@appuniversum/ember-appuniversum/'],
    },
    autoprefixer: {
      enabled: true,
      cascade: true,
      sourcemap: true,
    },
    babel: {
      plugins: [require.resolve('ember-auto-import/babel-plugin')],
    },
    // Disable chunk css fingerprinting until the config is included in ember-auto-import: https://github.com/ef4/ember-auto-import/pull/496
    fingerprint: {
      exclude: ['assets/chunk.*.css'],
    },
    '@appuniversum/ember-appuniversum': {
      disableWormholeElement: true,
    },
  });

  return app.toTree();
};
