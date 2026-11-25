import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessDisplayIpdcProducts extends Component {
  @service store;

  fetchIpdcProducts = restartableTask(async (processId) => {
    if (!processId) {
      return null;
    }

    return await this.store.findRecord('process', processId, {
      reload: true,
      include: 'ipdc-products',
    });
  });

  process = trackedTask(this, this.fetchIpdcProducts, () => [
    this.args.process?.id,
  ]);

  get ipdcProducts() {
    return Array.from(this.process.value?.ipdcProducts ?? []);
  }
}
