import Model, { attr, belongsTo } from '@ember-data/model';

export default class LinkModel extends Model {
  @attr('string') label;
  @attr('string') href;

  @belongsTo('process', {
    async: false,
    inverse: 'links',
    polymorphic: true,
  })
  process;

  get displayLabel() {
    if (!this.label) {
      return this.href;
    }
    return this.label;
  }
}
