import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';

export default class BpmnFilesBpmnFileRoute extends Route {
  @service store;

  async model() {
    let { id: fileId } = this.paramsFor('bpmn-files.bpmn-file');

    return {
      loadMetadataTaskInstance: this.loadBpmnFileTask.perform(fileId),
      loadedMetadata: this.loadBpmnFileTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadBpmnFileTask(fileId) {
    return yield this.store.findRecord('file', fileId, {
      include: 'publisher',
    });
  }
}
