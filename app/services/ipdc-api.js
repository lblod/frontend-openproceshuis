import Service from '@ember/service';

export default class IpdcApiService extends Service {
  async getProductByProductNumberOrId(productNumberOrId) {
    const response = await fetch(`/ipdc/doc/product/${productNumberOrId}`);
    if (!response.ok) {
      // Shouldn't we throw an error here?
      return null;
    }
    const product = await response.json();
    this._throwErrorOnUnsupportedResponseType(product);

    return product;
  }

  async getProducts({ searchValue }) {
    const params = [
      {
        key: 'gearchiveerd',
        value: false,
        isApplied: true,
      },
      {
        key: 'zoekterm',
        value: searchValue,
        isApplied: searchValue && searchValue.trim() !== '',
      },
    ].filter((param) => param.isApplied);
    const queryParams = params
      .map((param) => `${param.key}=${param.value}`)
      .join('&');

    const response = await fetch(`/ipdc/doc/product?${queryParams}`);
    if (!response.ok) {
      // Shouldn't we throw an error here?
      return [];
    }

    const products = await response.json();
    this._throwErrorOnUnsupportedResponseType(products);

    return products.hydraMember ?? []; // Default limit is 25
  }

  _throwErrorOnUnsupportedResponseType(jsonResponse) {
    const type = jsonResponse['@type'];
    if (['Collection', 'Instantie', 'Concept'].includes(type)) {
      return;
    }

    throw new Error('Unsupported type in IPDC response: ' + type);
  }
}
