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
    { process: { refreshModel: false } },
  ];

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model() {
    const params = this.paramsFor('information-assets.information-asset');
    const { id: canonicalAssetId, versionedAssetId } = params;

    const canonicalAsset = await this.fetchCanonicalAsset(canonicalAssetId);

    if (canonicalAsset.isVersionedInformationAsset) {
      await this.redirectToCanonical(canonicalAssetId, params);
    }

    if (canonicalAsset.isArchived) {
      this.router.replaceWith('not-found');
    }

    let versionedAsset;
    if (versionedAssetId) {
      versionedAsset = await this.fetchVersionedAsset(versionedAssetId);
    } else {
      versionedAsset = await this.fetchNewestVersionedAsset(canonicalAssetId);
    }

    return { canonicalAsset, versionedAsset };
  }

  async fetchCanonicalAsset(id) {
    return await this.store.findRecord('information-asset', id, {
      include: 'creator,processes,attachments,links',
    });
  }

  async fetchVersionedAsset(id) {
    return await this.store.findRecord('versioned-information-asset', id, {
      include: 'creator',
    });
  }

  async fetchNewestVersionedAsset(canonicalAssetId) {
    const singleElementArray = await this.store.query(
      'versioned-information-asset',
      {
        reload: true,
        'filter[canonical][:id:]': canonicalAssetId,
        include: 'creator',
        page: {
          size: 1,
        },
        sort: '-created',
      },
    );
    return singleElementArray[0];
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

  resetController(controller, _isExiting, transition) {
    if (
      transition.targetName !== 'information-assets.information-asset.index'
    ) {
      controller.process = null;
    }
  }
}
