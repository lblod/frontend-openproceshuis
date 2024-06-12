import EmberRouter from '@ember/routing/router';
import config from 'frontend-openproceshuis/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('mock-login');

  this.route('switch-login');
  this.route('auth', { path: '/authorization' }, function () {
    this.route('callback');
    this.route('callback-error');
    this.route('login');
    this.route('logout');
    this.route('switch');
  });

  this.route('index', { path: '' });

  this.route('processes', { path: 'processen' }, function () {
    this.route('process', { path: '/:id/' }, function () {
      this.route('index', { path: '' });
    });
  });

  this.route('shared-processes', { path: 'gedeelde-processen' }, function () {
    this.route('index', { path: '' });
  });

  this.route('process-steps', { path: 'processtappen' }, function () {
    this.route('index', { path: '' });
  });

  this.route('legal', { path: '/legaal' }, function () {
    this.route('disclaimer');
    this.route('cookiestatement', { path: '/cookieverklaring' });
    this.route('accessibilitystatement', {
      path: '/toegankelijkheidsverklaring',
    });
  });

  this.route('unauthorized', { path: 'niet-toegestaan' });
  this.route('sparql');

  this.route('route-not-found', {
    path: '/*wildcard',
  });
  this.route('accessibility-statement');
  this.route('help');
  this.route('cookie-notice');
  this.route('disclaimer');
});
