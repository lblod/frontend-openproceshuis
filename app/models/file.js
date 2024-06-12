import Model, { attr, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class FileModel extends Model {
  @attr('string') name;
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @hasMany('process', { inverse: 'files', async: false }) process;

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  archive() {
    this.status = ENV.resourceStates.archived;
  }
}
