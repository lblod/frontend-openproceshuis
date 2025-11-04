import Service, { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class IpdcApiService extends Service {
  @service toaster;
  @service currentSession;

  @tracked gebiedIds = [];

  // This is a hack as we cannot apply any filters when fetching an instance by id
  async getProductByProductNumberOrIdForSession(productNumberOrId) {
    const productForId =
      await this.__getProductByProductNumberOrId(productNumberOrId);

    if (!productForId) {
      return null;
    }

    const isInGeoLocation = productForId.geografischToepassingsgebieden.some(
      (code) => this.gebiedIds.includes(code),
    );

    return isInGeoLocation ? productForId : null;
  }

  async __getProductByProductNumberOrId(productNumberOrId) {
    const response = await fetch(`/ipdc/doc/product/${productNumberOrId}`);
    if (!response.ok) {
      const errorMessage = `Kon het product niet vinden met nummer: ${productNumberOrId}`;
      this.toaster.error(errorMessage, 'IPDC', {
        timeOut: 5000,
      });
      throw new Error(errorMessage);
    }
    const product = await response.json();
    this._throwErrorOnUnsupportedResponseType(product);

    return product; // This product is not restricted to the current session
  }

  async getProducts({ searchValue }) {
    const hasSearchValue = Boolean(searchValue && searchValue.trim());
    const instances = await this.__getInstances({ searchValue });

    if (!hasSearchValue) {
      return instances;
    }
    const concepts = await this.__getConcepts({ searchValue });

    return [...instances, ...concepts];
  }

  async __getInstances({ searchValue }) {
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
        key: 'includeParentGeografischeToepassingsgebieden',
        value: false,
        isApplied: true,
      },
      {
        key: 'geografischeToepassingsgebieden',
        value: this.gebiedIds.join(','),
        isApplied: Boolean(this.gebiedIds?.length),
      },
      {
        key: 'zoekterm',
        value: searchValue,
        isApplied: Boolean(searchValue && searchValue.trim()),
      },
    ].filter((param) => param.isApplied);
    const queryParams = params
      .map((param) => `${param.key}=${param.value}`)
      .join('&');

    const response = await fetch(`/ipdc/doc/instantie/export?${queryParams}`);
    if (!response.ok) {
      const errorMessage = `Er liep iets mis bij het vinden van instanties met zoekterm: "${searchValue ?? '*'}"`;
      this.toaster.error(errorMessage, 'IPDC', {
        timeOut: 5000,
      });
      throw new Error(errorMessage);
    }

    const instances = await response.json();
    this._throwErrorOnUnsupportedResponseType(instances);

    return instances.hydraMember ?? []; // Default limit is 25
  }

  async __getConcepts({ searchValue }) {
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
        key: 'zoekterm',
        value: searchValue,
        isApplied: Boolean(searchValue && searchValue.trim()),
      },
    ].filter((param) => param.isApplied);
    const queryParams = params
      .map((param) => `${param.key}=${param.value}`)
      .join('&');

    const response = await fetch(`/ipdc/doc/concept/export?${queryParams}`);
    if (!response.ok) {
      const errorMessage = `Er liep iets mis bij het vinden van concepten met zoekterm: "${searchValue ?? '*'}"`;
      this.toaster.error(errorMessage, 'IPDC', {
        timeOut: 5000,
      });
      throw new Error(errorMessage);
    }

    const concepts = await response.json();
    this._throwErrorOnUnsupportedResponseType(concepts);

    return concepts.hydraMember ?? []; // Default limit is 25
  }

  async getToepassingsGebiedenCodelist() {
    const response = await fetch(
      `/ipdc/api/codelijsten/geografisch-toepassingsgebied?include-inactive=false`,
    );
    if (!response.ok) {
      const errorMessage = `Er liep iets mis bij het ophalen van de product toepassingsgebieden`;
      this.toaster.error(errorMessage, 'IPDC', {
        timeOut: 5000,
      });
      throw new Error(errorMessage);
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
