import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { restartableTask, timeout } from 'ember-concurrency';

export default class ProcessDetailsCardIpdcMultipleSelectComponent extends Component {
  @service store;
  @service ipdcApi;

  @tracked products = A([]);

  @restartableTask
  *loadIpdcProductsTask(searchParams = '') {
    if (this.products.length >= 1) {
      this.products.clear();
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
    this.products.clear();
    results.map((result) => {
      const names = Object.entries(result.naam).map(([language, content]) => ({
        content,
        language,
      }));
      // TODO: Update the queryParams when the api supports only searching in title content
      const dutchName = names
        .find((name) => name.language === 'nl')
        ?.content?.toLowerCase();
      if (
        !productNumberOrId &&
        searchValue &&
        !dutchName.startsWith(searchValue?.toLowerCase()) // Not fool proof as it filters in the 25 results
      ) {
        return null;
      }
      const product = {
        name: names,
        productNumber: result.productnummer,
        type: typeMapping[result['@type']],
        isDraft: true,
      };
      this.products.pushObject(product);
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
}
