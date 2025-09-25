import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';

export default class ProcessDetailsCardIpdcMultipleSelectComponent extends Component {
  @service store;

  @restartableTask
  *loadIpdcProductsTask(searchParams = '') {
    if (!searchParams) return;

    yield timeout(500);

    let results = [];
    const productNumberOrId = this.extractNumberOrId(searchParams);
    if (productNumberOrId) {
      const response = yield fetch(`/ipdc/doc/product/${productNumberOrId}`);
      if (!response.ok) return [];

      const jsonResponse = yield response.json();
      this.throwErrorOnUnsupportedResponseType(jsonResponse);

      results = [jsonResponse];
    } else {
      const response = yield fetch(
        `/ipdc/doc/product?gearchiveerd=false&zoekterm=${searchParams}`,
      );
      if (!response.ok) return [];

      const jsonResponse = yield response.json();
      this.throwErrorOnUnsupportedResponseType(jsonResponse);

      results = jsonResponse.hydraMember ?? []; // Default imit is 25
    }

    const typeMapping = {
      ['Instantie']: 'ipdc-instance',
      ['Concept']: 'ipdc-concept',
    };
    return results
      .map((product) => {
        const name = Object.entries(product.naam).map(
          ([language, content]) => ({
            content,
            language,
          }),
        );
        // TODO: Update the queryParams when the api supports only searching in title content
        const namesJoin = name.map((n) => n.content).join(' ');
        if (
          !productNumberOrId &&
          searchParams &&
          !namesJoin.includes(searchParams)
        ) {
          return null;
        }

        return {
          name,
          productNumber: product.productnummer,
          type: typeMapping[product['@type']],
          isDraft: true,
        };
      })
      .filter((isProduct) => isProduct);
  }

  throwErrorOnUnsupportedResponseType(jsonResponse) {
    const type = jsonResponse['@type'];
    if (['Collection', 'Instantie', 'Concept'].includes(type)) {
      return;
    }

    throw new Error('Unsupported type in IPDC response: ' + type);
  }

  extractNumberOrId(input) {
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
