import ProcessModel from './process';

import { belongsTo, hasMany } from '@ember-data/model';

export default class VersionedProcessModel extends ProcessModel {
  @belongsTo('process', {
    inverse: null,
    async: false,
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

  @hasMany('information-asset', {
    async: false,
    inverse: 'processes',
    polymorphic: true,
    as: 'process',
  })
  informationAssets;

  @hasMany('administrative-unit-classification-code', {
    async: false,
    inverse: 'processes',
    polymorphic: true,
    as: 'process',
  })
  relevantAdministrativeUnits;

  async save() {
    this.isVersionedResource = true;
    await super.save(...arguments);
  }
}
