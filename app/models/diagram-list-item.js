import Model, { belongsTo, hasMany, attr } from '@ember-data/model';

import { ARCHIVED_STATUS_URI } from '../utils/well-known-uris';

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
    return this.status === ARCHIVED_STATUS_URI;
  }

  setArchivedStatus() {
    this.status = ARCHIVED_STATUS_URI;
  }
}
