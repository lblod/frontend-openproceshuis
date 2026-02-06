import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class InformationAssetIndexRoute extends Route {
  @service session;
  @service store;
  @service processApi;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model() {
    const { id } = this.paramsFor('information-assets.edit');

    return await this.store.findRecord('information-asset', id, {
      include: 'creator,processes,previous-version',
    });
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.loadTimeline();
  }
}
