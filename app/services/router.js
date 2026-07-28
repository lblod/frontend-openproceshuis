import RouterService from '@ember/routing/router-service';
import { tracked } from '@glimmer/tracking';

export default class AppRouterService extends RouterService {
  @tracked _activeTransition = null;

  constructor() {
    super(...arguments);

    this.on('routeWillChange', (transition) => {
      this._activeTransition = transition;
    });

    this.on('routeDidChange', () => {
      this._activeTransition = null;
    });
  }

  get isLoading() {
    return this._activeTransition !== null;
  }

  willDestroy() {
    this.off('routeWillChange');
    this.off('routeDidChange');
    super.willDestroy();
  }
}
