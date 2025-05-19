import Model, { attr, hasMany } from '@ember-data/model';

export default class IpdcProductModel extends Model {
  @attr('language-string-set') name;
  @attr('string') productNumber;

  @hasMany('process', {
    inverse: 'ipdcProducts',
    async: false,
    as: 'ipdc-product',
  })
  processes;

  get url() {
    return `https://productencatalogus-v3.vlaanderen.be/product/${this.productNumber}`;
  }
}
