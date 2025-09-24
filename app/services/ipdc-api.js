import Service, { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class IpdcApiService extends Service {
  @service currentSession;

  @tracked gebiedIds = [];

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
        key: 'sortBy',
        value: 'LAATST_GEWIJZIGD',
        isApplied: true,
      },
      {
        key: 'gearchiveerd',
        value: false,
        isApplied: true,
      },
      {
        key: 'doelgroepen',
        value: 'LokaalBestuur',
        isApplied: true,
      },
      {
        key: 'geografischeToepassingsgebieden',
        value: this.gebiedIds.join(','),
        isApplied: this.gebiedIds?.length >= 1,
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

  async getToepassingsGebiedenCodelist() {
    const response = await fetch(
      `/ipdc/api/codelijsten/geografisch-toepassingsgebied?include-inactive=false`,
    );
    if (!response.ok) {
      // Shouldn't we throw an error here?
      return null;
    }

    const results = await response.json();
    const gebieden = [...(results.waardes ?? [])];
    this.gebiedIds = this._getGebiedIds(gebieden);
  }

  _getGebiedIds(gebieden) {
    const name = this.currentSession.group?.name?.toLowerCase();
    if (!name) {
      return null;
    }

    return gebieden
      .filter((gebied) => name.includes(gebied.labels['nl']?.toLowerCase()))
      .map((gebied) => gebied.id)
      .filter((isPostCode) => isPostCode);
  }

  _throwErrorOnUnsupportedResponseType(jsonResponse) {
    const type = jsonResponse['@type'];
    if (['Collection', 'Instantie', 'Concept'].includes(type)) {
      return;
    }

    throw new Error('Unsupported type in IPDC response: ' + type);
  }
}
