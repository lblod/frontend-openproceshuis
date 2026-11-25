import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessDisplayLinkedBlueprints extends Component {
  @service store;

  fetchLinkedBlueprints = restartableTask(async (processId) => {
    if (!processId) {
      return null;
    }

    return await this.store.findRecord('process', processId, {
      reload: true,
      include: 'linked-blueprints',
    });
  });

  process = trackedTask(this, this.fetchLinkedBlueprints, () => [
    this.args.process?.id,
  ]);

  get blueprints() {
    return Array.from(this.process.value?.linkedBlueprints ?? []).filter(
      (blueprint) => !blueprint.isArchived,
    );
  }
}
