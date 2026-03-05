import { belongsTo } from '@ember-data/model';
import InformationAssetModel from './information-asset';

export default class VersionedInformationAssetModel extends InformationAssetModel {
  @belongsTo('information-asset', {
    inverse: 'versions',
    async: false,
    polymorphic: true,
  })
  canonical;
  @belongsTo('versioned-information-asset', { inverse: null, async: false })
  previousVersion;

  get isVersionedInformationAsset() {
    return true;
  }
}
