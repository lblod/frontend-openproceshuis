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
  @attr('string') status;

  @hasMany('diagram-list-item', { inverse: null, async: false })
  diagrams;

  get displayVersion() {
    return this.version ?? '/';
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  archive() {
    this.status = ENV.resourceStates.archived;
  }
}
