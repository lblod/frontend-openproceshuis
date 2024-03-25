import Model, { attr, belongsTo } from '@ember-data/model';
import { modelValidator } from 'ember-model-validator';

@modelValidator
export default class FileModel extends Model {
  @attr('string') name;
  @attr('string') description;
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('boolean') archived;

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
}
