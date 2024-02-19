import EmberRouter from '@ember/routing/router';
import config from 'frontend-openproceshuis/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('mock-login');

  this.route('auth', { path: '/authorization' }, function () {
    this.route('logout');
  });

  this.route('index', { path: '' });

  this.route('bpmn-files', { path: 'bpmn-bestanden' }, function () {
    this.route('bpmn-file', { path: '/:id/' }, function () {
      this.route('index', { path: '' });
    });
  });

  this.route('bpmn-elements', { path: 'processtappen' }, function () {
    this.route('index', { path: '' });
  });

  this.route('legal', { path: '/legaal' }, function () {
    this.route('disclaimer');
    this.route('cookiestatement', { path: '/cookieverklaring' });
    this.route('accessibilitystatement', {
      path: '/toegankelijkheidsverklaring',
    });
  });

  this.route('route-not-found', {
    path: '/*wildcard',
  });
});
