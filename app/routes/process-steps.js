import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProcessStepsRoute extends Route {
  @service store;

  model() {
    let query = {
      include: 'processes.derivations',
    };

    return this.store.query('task', query);
  }
}
