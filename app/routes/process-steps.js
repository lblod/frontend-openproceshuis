import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProcessStepsRoute extends Route {
  @service store;

  model() {
    this.store.findAll('task');
  }
}
