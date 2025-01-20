import IpdcProductModel from './ipdc-product';

export default class IpdcInstanceModel extends IpdcProductModel {
  get type() {
    return 'instance';
  }

  get url() {
    return `${super.url}/instantie/${this.productNumber}`;
  }
}
