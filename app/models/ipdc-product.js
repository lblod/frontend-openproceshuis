import Model, { attr } from '@ember-data/model';

export default class IpdcProductModel extends Model {
  @attr('language-string-set') name;
  @attr('string') productNumber;

  get url() {
    return `https://productencatalogus-v3.vlaanderen.be/product/${this.productNumber}`;
  }
}
