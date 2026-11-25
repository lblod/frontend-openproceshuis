import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ProcessDisplayMainDiagramCount extends Component {
  @service store;

  fetchDiagramLists = restartableTask(async (processId) => {
    if (!processId) {
      return null;
    }

    return await this.store.findRecord('process', processId, {
      reload: true,
      include: 'diagram-lists,diagram-lists.diagrams',
    });
  });

  process = trackedTask(this, this.fetchDiagramLists, () => [
    this.args.process?.id,
  ]);

  get count() {
    const latestList = Array.from(this.process.value?.diagramLists ?? [])
      .filter((_list) => !_list.isArchived)
      .sort((a, b) => new Date(b.created) - new Date(a.created))[0];

    if (!latestList) {
      return 0;
    }

    return Array.from(latestList.diagrams ?? []).filter(
      (_diagram) => !_diagram.isArchived,
    ).length;
  }
}
