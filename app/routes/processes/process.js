import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProcessesProcessRoute extends Route {
  @service store;
  @service router;
  @service session;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model({ id }, transition) {
    const parentRouteName = transition.to?.name?.replace('.index', '');
    const processId = id ?? this.modelFor(parentRouteName);

    const process = await this.store.findRecord('process', processId);

    return {
      process,
      breadcrumRouteName: parentRouteName,
    };
  }
}
