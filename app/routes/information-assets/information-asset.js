import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class InformationAssetsInformationAssetRoute extends Route {
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
    const params = this.paramsFor('information-assets.information-asset');
    const id = params.id;
    const { versionedAssetId } = params;

    const canonicalAsset = await this.fetchCanonicalAsset(id);

    if (canonicalAsset.isVersionedInformationAsset) {
      await this.redirectToCanonical(id, params);
    }

    const versionedAssets = await this.fetchVersionedAssets(id);
    const versionedAsset = versionedAssetId
      ? [...versionedAssets].find((asset) => asset.id === versionedAssetId)
      : versionedAssets[0];

    return { canonicalAsset, versionedAsset, versionedAssets };
  }

  async fetchCanonicalAsset(canonicalAssetId) {
    return await this.store.findRecord('information-asset', canonicalAssetId, {
      include: 'creator,processes,attachments,links',
    });
  }

  async fetchVersionedAssets(canonicalAssetId) {
    return await this.store.query('versioned-information-asset', {
      reload: true,
      'filter[canonical][:id:]': canonicalAssetId,
      include: 'creator',
      page: {
        size: 50,
      },
      sort: '-created',
    });
  }

  async redirectToCanonical(versionedAssetId, params) {
    const versionedInformationAsset = await this.store.findRecord(
      'versioned-information-asset',
      versionedAssetId,
    );

    const canonical = await versionedInformationAsset.canonical;

    this.router.replaceWith(
      'information-assets.information-asset',
      canonical.id,
      {
        queryParams: {
          ...params,
          versionedAssetId,
        },
      },
    );
  }
}
