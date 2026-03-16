import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class IcrAssetSelectByTitleComponent extends Component {
  @service store;

  loadAssetsTask = restartableTask(async (searchParams = '') => {
    if (!searchParams?.trim()) return;

    await timeout(200);

    const query = {
      filter: {
        title: searchParams,
        ':has:versions': true,
        ':not:status': ENV.resourceStates.archived,
      },
    };

    const result = await this.store.query('information-asset', query);

    if (result) {
      return [...[searchParams], ...new Set(result.map((r) => r.title))];
    }
  });
}
