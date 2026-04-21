import Model, { attr, hasMany } from '@ember-data/model';

export default class IpdcProductModel extends Model {
  @attr('language-string-set') name;
  @attr('string') productNumber;

  @hasMany('process', {
    async: false,
    inverse: 'ipdcProducts',
    polymorphic: true,
    as: 'ipdc-product',
  })
  processes;

  get url() {
    return `https://productencatalogus-v3.vlaanderen.be/product/${this.productNumber}`;
  }

  get searchKeys() {
    let names = this.name.map((ls) => ls.content?.toLowerCase()).join(' ');
    return `${names} ${this.productNumber ?? ''}`;
  }
}
