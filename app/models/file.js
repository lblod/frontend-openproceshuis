import Model, { attr, hasMany } from '@ember-data/model';
import { modelValidator } from 'ember-model-validator';

export const ARCHIVED_STATUS =
  'http://lblod.data.gift/concepts/concept-status/gearchiveerd';

@modelValidator
export default class FileModel extends Model {
  @attr('string') name;
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @hasMany('process', { inverse: 'files', async: false }) process;

  validations = {
    name: {
      presence: true,
    },
  };

  get isArchived() {
    return this.status === ARCHIVED_STATUS;
  }

  archive() {
    this.status = ARCHIVED_STATUS;
  }
}
