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

    announce: {
      maintenance: {
        enabled: '{{ANNOUNCE_MAINTENANCE_ENABLED}}',
        message: '{{ANNOUNCE_MAINTENANCE_MESSAGE}}',
      },
    },

    appName: 'Open Proces Huis',

    ovoCodes: {
      abb: 'OVO001835',
      dv: 'OVO002949',
    },

    conceptSchemes: {
      bpmnElementTypes:
        'http://lblod.data.gift/concept-schemes/d4259f0b-6d6e-4a46-b9e1-114b774e0f1e',
      informationAssets:
        'http://lblod.data.gift/concept-schemes/4c0f0408-01b9-4902-9640-477b667bd086',
      processGroups:
        'http://lblod.data.gift/concept-schemes/324e775f-2a48-4daa-9de0-9f62ef8ab22e',
      processDomains:
        'http://lblod.data.gift/concept-schemes/a8108a43-44fa-4b08-9794-064941f00dc1',
      processCategories:
        'http://lblod.data.gift/concept-schemes/21fba7d7-d0f5-4133-a108-626d0eb62298',
    },

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
