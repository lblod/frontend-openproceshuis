import Model, { attr, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessDomainModel extends Model {
  @attr('string') label;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;

  @hasMany('process-category', { inverse: null, async: false })
  processCategories;

  get processCategory() {
    if (!this.processCategories || this.processCategories.length === 0)
      return null;
    return this.processCategories[0];
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }
}
