import EmberRouter from '@ember/routing/router';
import config from 'frontend-openproceshuis/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('index', { path: '' });

  this.route('bpmn-files', { path: 'processen' }, function () {
    this.route('bpmn-file', { path: '/:id/' }, function () {
      this.route('index', { path: '' });
    });
    this.route('favorites', { path: 'favorieten' });
  });

  this.route('bpmn-uploads', { path: 'mijn-processen' }, function () {
    this.route('bpmn-file', { path: '/:id/' }, function () {
      this.route('index', { path: '' });
    });
  });

  this.route('bpmn-elements', { path: 'bouwblokken' }, function () {
    this.route('index', { path: '' });
  });

  this.route('route-not-found', {
    path: '/*wildcard',
  });
  this.route('accessibility-statement');
  this.route('help');
  this.route('cookie-notice');
  this.route('disclaimer');
});
