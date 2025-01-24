import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';

export default class OrganizationTypeMultipleSelectComponent extends Component {
  @service store;

  @restartableTask
  *loadIpdcProductsTask(searchParams = '') {
    if (!searchParams) return;

    yield timeout(500);

    const productNumberOrId = this.extractNumberOrId(searchParams);
    if (!productNumberOrId) return;

    const response = yield fetch(`/ipdc/doc/product/${productNumberOrId}`);
    if (!response.ok) return;
    const productJson = yield response.json();

    let type;
    if (productJson['@type'] === 'Instantie') type = 'ipdc-instance';
    else if (productJson['@type'] === 'Concept') type = 'ipdc-concept';
    else return;

    const draftIpdcProduct = {
      name: Object.entries(productJson.naam).map(([language, content]) => ({
        content,
        language,
      })),
      productNumber: productJson.productnummer,
      type,
      isDraft: true,
    };

    return [draftIpdcProduct];
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
