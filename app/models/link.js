import Model, { attr } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class LinkModel extends Model {
  @attr('string') label;
  @attr('string') href;
  @attr('string') status;

  get displayLabel() {
    if (!this.label) {
      return this.href;
    }
    return this.label;
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }
}
