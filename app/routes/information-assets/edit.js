import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class InformationAssetIndexRoute extends Route {
  @service session;
  @service router;
  @service store;

  queryParams = [
    { versionedAssetId: { refreshModel: true } },
    { pageAttachments: { refreshModel: true } },
    { sizeAttachments: { refreshModel: true } },
    { sortAttachments: { refreshModel: true } },
  ];

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model() {
    const params = this.paramsFor('information-assets.edit');
    const id = params.id;

    const informationAsset = await this.store.findRecord(
      'information-asset',
      id,
      {
        include: 'creator,processes,links,versions',
      },
    );

    if (informationAsset.isVersionedInformationAsset) {
      await this.redirectToCanonical(id, params);
    }

    return informationAsset;
  }

  async redirectToCanonical(versionedAssetId, params) {
    const versionedInformationAsset = await this.store.findRecord(
      'versioned-information-asset',
      versionedAssetId,
    );

    const canonical = await versionedInformationAsset.canonical;

    this.router.replaceWith('information-assets.edit', canonical.id, {
      queryParams: {
        ...params,
        versionedAssetId: versionedAssetId,
      },
    });
  }
}
