import Model, { attr, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ConceptualProcessModel extends Model {
  @attr('string') title;
  @attr('number') number;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;

  @hasMany('process-group', { inverse: null, async: false })
  processGroups;

  get processGroup() {
    if (!this.processGroups || this.processGroups.length === 0) return null;
    return this.processGroups[0];
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }
}
