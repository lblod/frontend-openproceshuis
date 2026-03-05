import Component from '@glimmer/component';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';

export default class IcrVersions extends Component {
  @service store;

  @tracked versions = A([]);

  get versionsAreLoading() {
    return this.versionsTask.isRunning;
  }

  fetchVersions = restartableTask(async () => {
    const canonicalAssetId = this.args.canonicalAsset?.id;
    if (!canonicalAssetId) {
      this.versions = [];
    }

    const query = {
      reload: true,
      page: {
        size: 50,
      },
      sort: '-created',
      'filter[canonical][:id:]': canonicalAssetId,
    };

    this.versions = await this.store.query(
      'versioned-information-asset',
      query,
    );
  });

  versionsTask = trackedTask(this, this.fetchVersions, () => [
    this.args.canonicalAsset?.id,
  ]);
}
