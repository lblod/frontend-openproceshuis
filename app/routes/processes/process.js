import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class ProcessesProcessRoute extends Route {
  @service store;
  @service router;
  @service session;

  beforeModel(transition) {
    if (!this.session.isAuthenticated) {
      this.session.requireAuthentication(transition, 'auth.login');
    }
  }

  async model(params) {
    try {
      const process = await this.store.findRecord('process', params.id, {
        include: [
          'process-statistics',
          'publisher',
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
        reload: true,
      });

      return process;
    } catch (error) {
      throw new Error(`Er werd geen process met id "${params.id}" gevonden.`);
    }
  }
}
