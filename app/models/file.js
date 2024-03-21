import Model, { attr, belongsTo } from '@ember-data/model';
export default class FileModel extends Model {
  @attr('string') name;
  @attr('string') description;
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('iso-date') created;
  @attr('iso-date') modified;

  @belongsTo('group', {
    inverse: null,
    async: false,
  })
  publisher;
}
