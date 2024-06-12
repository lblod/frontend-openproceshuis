import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessModel extends Model {
  @attr('string') title;
  @attr('string') description;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @belongsTo('group', { inverse: null, async: false }) publisher;
  @hasMany('file', { inverse: 'process', async: false }) files;

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  archive() {
    this.status = ENV.resourceStates.archived;
  }
}
