import Model, { attr } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class LinkModel extends Model {
  @attr('string') label;
  @attr('string') href;
  @attr('string') status;
  @attr('iso-date', {
    default: new Date(),
  })
  created;
  @attr('iso-date', {
    default: new Date(),
  })
  modified;

  get displayLabel() {
    if (!this.label) {
      return this.href;
    }
    return this.label;
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  async save() {
    if (!this.created) {
      this.created = new Date();
    }

    this.modified = new Date();
    await super.save(...arguments);
  }
}
