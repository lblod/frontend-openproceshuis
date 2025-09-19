import Model, { attr } from '@ember-data/model';

export default class LinkModel extends Model {
  @attr('string') label;
  @attr('string') href;

  get displayLabel() {
    if (!this.label) {
      return this.href;
    }
    return this.label;
  }
}
