import Model, { belongsTo, hasMany, attr } from '@ember-data/model';

export default class ListItemModel extends Model {
  @attr('number') position;
  @attr('string', {
    defaultValue: new Date(),
  })
  created;
  @attr('string') modified;

  @belongsTo('file', { inverse: null, async: false }) diagramFile;
  @hasMany('list-item', { inverse: null, async: false })
  subItems;
}
