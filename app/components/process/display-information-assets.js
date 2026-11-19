import Component from '@glimmer/component';

import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessDisplayInformationAssets extends Component {
  @service store;

  fetchInformationAssets = restartableTask(async (processId) => {
    if (!processId) {
      return null;
    }

    return await this.store.findRecord('process', processId, {
      reload: true,
      include: 'information-assets',
    });
  });

  process = trackedTask(this, this.fetchInformationAssets, () => [
    this.args.process?.id,
  ]);

  get assets() {
    return Array.from(this.process.value?.informationAssets ?? []).filter(
      (_asset) => !_asset.isArchived,
    );
  }
}
