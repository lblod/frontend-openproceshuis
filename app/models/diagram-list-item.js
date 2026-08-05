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

  async archive() {
    this.status = ARCHIVED_STATUS_URI;
    await this.save();
  }

  get sortedSubItems() {
    return Array.from(this.subItems).sort((a, b) => b.position - a.position);
  }

  get hasSubItems() {
    if (this.subItems?.length === 0) {
      return false;
    }

    const withoutArchived = Array.from(this.subItems).filter(
      (item) => !item.isArchived,
    );

    return withoutArchived?.length >= 1;
  }

  async save() {
    this.modified = new Date();
    await super.save(...arguments);
  }
}
