import Model, { hasMany, attr } from '@ember-data/model';

export default class DiagramListModel extends Model {
  @attr('string') order;
  @attr('string') version;
  @attr('string', {
    defaultValue: new Date(),
  })
  created;
  @attr('string') modified;

  @hasMany('list-item', { inverse: null, async: false })
  diagrams;
}
