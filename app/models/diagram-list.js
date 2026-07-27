import Model, { hasMany, attr } from '@ember-data/model';

import ENV from 'frontend-openproceshuis/config/environment';
import { ARCHIVED_STATUS_URI } from '../utils/well-known-uris';

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
    return this.status === ARCHIVED_STATUS_URI;
  }

  async archive() {
    this.status = ARCHIVED_STATUS_URI;
    await this.save();
    await Promise.all(this.diagrams.map((_diagram) => _diagram.archive()));
  }

  async save() {
    this.modified = new Date();
    await super.save(...arguments);
  }

  async recalculateDiagramPositions() {
    this.diagrams.map((_diagram, index) => {
      const expectedPosition = index + 1;
      if (_diagram.position !== expectedPosition) {
        _diagram.position = expectedPosition;
        _diagram.save();
      }
    });
  }
}
