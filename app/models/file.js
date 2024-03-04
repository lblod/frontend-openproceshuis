import Model, { attr } from '@ember-data/model';
export default class FileModel extends Model {
  @attr('string') name;
  @attr('string') description;
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('date') created;
  @attr('date') modified;
}
