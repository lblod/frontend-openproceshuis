import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class IcrAssetSelectByTitleComponent extends Component {
  @service store;

  @restartableTask
  *loadAssetsTask(searchParams = '') {
    if (!searchParams?.trim()) return;

    yield timeout(200);

    const query = {
      filter: {
        title: searchParams,
        ':has:versions': true,
        ':not:status': ENV.resourceStates.archived,
      },
    };

    const result = yield this.store.query('information-asset', query);

    if (result) {
      return [...[searchParams], ...new Set(result.map((r) => r.title))];
    }
  }
}
