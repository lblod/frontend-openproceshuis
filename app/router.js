import EmberRouter from '@ember/routing/router';
import config from 'frontend-processendatabank/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('index', { path: '' });

  this.route('bpmn-files', { path: 'bpmn-bestanden' }, function () {
    this.route('bpmn-file', { path: '/:id/' }, function () {
      this.route('index', { path: '' });
    });
  });

  this.route('process-steps', { path: 'processtappen' });

  this.route('route-not-found', {
    path: '/*wildcard',
  });
});
