import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';

export default class OrganizationTypeMultipleSelectComponent extends Component {
  @service store;

  @restartableTask
  *loadIpdcInstancesTask(searchParams = '') {
    if (!searchParams) return;

    yield timeout(500);

    const instanceNumberOrId = this.extractNumberOrId(searchParams);
    if (!instanceNumberOrId) return;

    const response = yield fetch(`/ipdc/doc/instantie/${instanceNumberOrId}`);
    if (!response.ok) throw Error(response.status);
    const instanceJson = yield response.json();

    const instance = this.store.createRecord('ipdc-instance', {
      name: Object.entries(instanceJson.naam).map(([language, content]) => ({
        content,
        language,
      })),
      productNumber: instanceJson.productnummer,
    });

    return [instance];
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
