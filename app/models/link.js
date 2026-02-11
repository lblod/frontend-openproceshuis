import Model, { attr, hasMany } from '@ember-data/model';

export default class LinkModel extends Model {
  @attr('string') label;
  @attr('string') href;

  @hasMany('information-asset', {
    inverse: null,
    async: false,
  })
  informationAssets;

  get displayLabel() {
    if (!this.label) {
      return this.href;
    }
    return this.label;
  }
}
