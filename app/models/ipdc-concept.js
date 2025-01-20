import IpdcProductModel from './ipdc-product';

export default class IpdcConceptModel extends IpdcProductModel {
  get type() {
    return 'concept';
  }

  get url() {
    return `${super.url}/concept/${this.productNumber}`;
  }
}
