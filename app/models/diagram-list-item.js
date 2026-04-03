import Model, { belongsTo, hasMany, attr } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class DiagramListItemModel extends Model {
  @attr('number', {
    defaultValue: 1,
  })
  position;
  @attr('string', {
    defaultValue: new Date(),
  })
  created;
  @attr('string') modified;
  @attr('string') status;

  @belongsTo('file', { inverse: null, async: false }) diagramFile;
  @hasMany('diagram-list-item', { inverse: null, async: false })
  subItems;

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }
}
