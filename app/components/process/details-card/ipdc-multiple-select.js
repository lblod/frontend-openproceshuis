import Component from '@glimmer/component';

import { service } from '@ember/service';

import { restartableTask, timeout } from 'ember-concurrency';

export default class ProcessDetailsCardIpdcMultipleSelectComponent extends Component {
  @service store;
  @service ipdcApi;

  @restartableTask
  *loadIpdcProductsTask(searchParams = '') {
    if (!searchParams?.trim()) {
      return [];
    }
    yield timeout(500);

    const searchValue = typeof searchParams === 'string' ? searchParams : null;
    let results = [];
    const productNumberOrId = this.extractPossibleNumberOrId(searchParams);
    if (productNumberOrId) {
      const product =
        yield this.ipdcApi.getProductByProductNumberOrIdForSession(
          productNumberOrId,
        );
      if (product) {
        results = [product];
      }
    } else {
      const products = yield this.ipdcApi.getProducts({
        searchValue,
      });
      results = [...products];
    }

    const typeMapping = {
      ['Instantie']: 'ipdc-instance',
      ['Concept']: 'ipdc-concept',
    };
    return results.map((result) => {
      const names = Object.entries(result.naam).map(([language, content]) => ({
        content,
        language,
      }));
      return {
        name: names,
        productNumber: result.productnummer,
        type: typeMapping[result['@type']],
        isDraft: true,
      };
    });
  }

  extractPossibleNumberOrId(input) {
    if (!input || typeof input !== 'string') {
      return null;
    }

    input = input.trim();

    try {
      const url = new URL(input);
      input = url.pathname.split('/').pop();
    } catch {
      /* empty */
    }

    const numberPattern = /^\d+$/;
    const uuidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (numberPattern.test(input) || uuidPattern.test(input)) return input;

    return null;
  }

  get searchInIpdcUrl() {
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
        value: this.ipdcApi.gebiedIds.join(','),
        isApplied: Boolean(this.ipdcApi.gebiedIds?.length),
      },
    ].filter((param) => param.isApplied);
    const queryParams = params
      .map((param) => `${param.key}=${param.value}`)
      .join('&');
    return `https://productencatalogus-v3.vlaanderen.be/nl/producten?${queryParams}`;
  }
}
