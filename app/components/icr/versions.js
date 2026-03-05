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
    const asset = this.args.asset;
    if (!asset) {
      this.versions = [];
    }

    const query = {
      reload: true,
      page: {
        size: 50,
      },
      sort: '-created',
    };

    if (asset.isVersionedInformationAsset) {
      query['filter[canonical][versions][:id:]'] = asset.id;
    } else {
      query['filter[canonical][:id:]'] = asset.id;
    }

    this.versions = await this.store.query(
      'versioned-information-asset',
      query,
    );
  });

  versionsTask = trackedTask(this, this.fetchVersions, () => [
    this.args.asset?.id,
  ]);
}
