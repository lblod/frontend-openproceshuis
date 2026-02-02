import Model, { hasMany, attr } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class DiagramListModel extends Model {
  @attr('string', {
    defaultValue: ENV.diagramList.unordered,
  })
  order;
  @attr('string') version;
  @attr('string', {
    defaultValue: new Date(),
  })
  created;
  @attr('string') modified;

  @hasMany('diagram-list-item', { inverse: null, async: false })
  diagrams;
}
