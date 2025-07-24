import Model, { attr, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessGroupModel extends Model {
  @attr('string') label;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;

  @hasMany('process-domain', { inverse: null, async: false })
  processDomains;

  get processDomain() {
    if (!this.processDomains || this.processDomains.length === 0) return null;
    return this.processDomains[0];
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }
}
