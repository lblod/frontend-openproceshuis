'use strict';

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'frontend-openproceshuis',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      EXTEND_PROTOTYPES: false,
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    appName: 'Open Proces Huis',

    resourceStates: {
      archived: 'http://lblod.data.gift/concepts/concept-status/gearchiveerd',
    },

    jobStates: {
      scheduled: 'http://redpencil.data.gift/id/concept/JobStatus/scheduled',
      busy: 'http://redpencil.data.gift/id/concept/JobStatus/busy',
      success: 'http://redpencil.data.gift/id/concept/JobStatus/success',
      failed: 'http://redpencil.data.gift/id/concept/JobStatus/failed',
      canceled: 'http://redpencil.data.gift/id/concept/JobStatus/canceled',
    },

    yasgui: {
      defaultQuery: '{{YASGUI_DEFAULT_QUERY}}',
      extraPrefixes: '{{YASGUI_EXTRA_PREFIXES}}',
    },

    mockLogin: {
      disabled: '{{DISABLE_MOCK_LOGIN}}',
    },

    acmidm: {
      clientId: '{{OAUTH_API_KEY}}',
      scope: '{{OAUTH_API_SCOPE}}',
      authUrl: '{{OAUTH_API_BASE_URL}}',
      logoutUrl: '{{OAUTH_API_LOGOUT_URL}}',
      authRedirectUrl: '{{OAUTH_API_REDIRECT_URL}}',
      switchRedirectUrl: '{{OAUTH_SWITCH_URL}}',
    },

    plausible: {
      domain: '{{ANALYTICS_APP_DOMAIN}}',
      apiHost: '{{ANALYTICS_API_HOST}}',
    },
  };

  if (environment === 'development') {
    ENV.showAppVersionHash = true;
    ENV.environmentName = 'development';
    ENV.environmentTitle = 'ontwikkelomgeving';
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';
    ENV.environmentName = 'test';
    ENV.environmentTitle = 'testomgeving';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  return ENV;
};
