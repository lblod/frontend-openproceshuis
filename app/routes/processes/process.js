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
    let processId = id;
    if (!id) {
      const inheritedModelId = this.modelFor(parentRouteName);

      processId = inheritedModelId;
    }
    const process = await this.store.findRecord('process', processId, {
      include: [
        'process-statistics',
        'publisher',
        'creator',
        'publisher.primary-site',
        'publisher.primary-site.contacts',
        'publisher.classification',
        'ipdc-products',
        'information-assets',
        'linked-concept',
        'linked-concept.process-groups.process-domains',
        'linked-concept.process-groups.process-domains.process-categories',
        'relevant-administrative-units',
      ].join(','),
    });

    return {
      process,
      breadcrumRouteName: parentRouteName,
    };
  }
}
