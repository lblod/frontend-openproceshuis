import ProcessModel from './process';

import { belongsTo } from '@ember-data/model';

export default class VersionedProcessModel extends ProcessModel {
  @belongsTo('process', {
    inverse: 'versions',
    async: true,
    polymorphic: true,
  })
  canonical;
  @belongsTo('versioned-process', { inverse: null, async: false })
  previousVersion;
}
