import EmberRouter from '@ember/routing/router';
import ENV from 'frontend-openproceshuis/config/environment';

export default class Router extends EmberRouter {
  location = ENV.locationType;
  rootURL = ENV.rootURL;
}

Router.map(function () {
  if (
    ENV.mockLogin.disabled === '{{DISABLE_MOCK_LOGIN}}' ||
    ENV.mockLogin.disabled === 'false' ||
    !ENV.mockLogin.disabled
  )
    this.route('mock-login');

  this.route('switch-login');
  this.route('auth', { path: '/authorization' }, function () {
    this.route('callback');
    this.route('callback-error');
    this.route('login');
    this.route('logout');
    this.route('switch');
  });

  this.route('impersonate');

  this.route('index', { path: '' });

  this.route('processes', { path: 'processen' }, function () {
    this.route('process', { path: '/:id/' }, function () {
      this.route('index', { path: '' });
    });
  });

  this.route('shared-processes', { path: 'gedeelde-processen' }, function () {
    this.route('index', { path: '' });
  });

  this.route(
    'my-local-government',
    { path: 'mijn-lokaal-bestuur' },
    function () {
      this.route('index', { path: '' });
    },
  );

  this.route('inventory', { path: 'inventaris' }, function () {
    this.route('index', { path: '' });
    this.route('admin');
  });

  this.route('information-assets', { path: 'informatie-assets' }, function () {
    this.route('index', { path: '' });
    this.route('edit', { path: '/:id' });
  });

  this.route('legal', { path: '/legaal' }, function () {
    this.route('disclaimer');
    this.route('cookiestatement', { path: '/cookieverklaring' });
    this.route('accessibilitystatement', {
      path: '/toegankelijkheidsverklaring',
    });
  });

  this.route('reporting', { path: '/rapportering' });

  this.route('unauthorized', { path: 'niet-toegestaan' });
  this.route('sparql');

  this.route('route-not-found', {
    path: '/*wildcard',
  });
  this.route('accessibility-statement');
  this.route('cookie-notice');
  this.route('disclaimer');
});
