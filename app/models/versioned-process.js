import ProcessModel from './process';

import { belongsTo, hasMany } from '@ember-data/model';

export default class VersionedProcessModel extends ProcessModel {
  @belongsTo('process', {
    inverse: 'versions',
    async: true,
    as: 'process',
    polymorphic: true,
  })
  canonical;
  @belongsTo('versioned-process', { inverse: null, async: false })
  previousVersion;

  @belongsTo('process-statistic', {
    async: false,
    inverse: 'process',
    as: 'process',
    polymorphic: false,
  })
  processStatistics;

  @hasMany('ipdc-product', {
    async: false,
    inverse: 'processes',
    polymorphic: true,
    as: 'process',
  })
  ipdcProducts;

  async save() {
    this.isVersionedResource = true;
    await super.save(...arguments);
  }
}
