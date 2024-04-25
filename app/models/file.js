import Model, { attr, belongsTo } from '@ember-data/model';
import { modelValidator } from 'ember-model-validator';

export const ARCHIVED_STATUS =
  'http://lblod.data.gift/concepts/concept-status/gearchiveerd';

@modelValidator
export default class FileModel extends Model {
  @attr('string') name;
  @attr('string') description;
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;

  @belongsTo('group', {
    inverse: null,
    async: false,
  })
  publisher;

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
