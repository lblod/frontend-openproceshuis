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

    const informationAsset = await this.store.findRecord(
      'information-asset',
      id,
      {
        include: 'creator,processes,previous-version,links',
      },
    );
    return informationAsset;
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.loadTimeline();
  }
}
