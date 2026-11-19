import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

import { ARCHIVED_STATUS_URI } from '../../utils/well-known-uris';

export default class ProcessDisplayInformationAssets extends Component {
  @service store;

  fetchInformationAssets = restartableTask(async (processId) => {
    if (!processId) {
      return [];
    }

    return await this.store.query('information-asset', {
      'filter[processes][id]': processId,
      'filter[:not:status]': ARCHIVED_STATUS_URI,
      sort: ':no-case:title',
    });
  });

  informationAssets = trackedTask(this, this.fetchInformationAssets, () => [
    this.args.process?.id,
  ]);

  get assets() {
    return this.informationAssets.value ?? [];
  }
}
