import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask, task, waitForProperty } from 'ember-concurrency';
import generateBpmnDownloadUrl from 'frontend-openproceshuis/utils/bpmn-download-url';

export default class BpmnFilesBpmnFileRoute extends Route {
  @service store;

  async model() {
    let { id: fileId } = this.paramsFor('bpmn-files.bpmn-file');

    const loadMetadataTaskInstance = this.loadBpmnFileTask.perform(fileId);
    const loadedMetadata = this.loadBpmnFileTask.lastSuccesful?.value;
    const loadDiagramTaskInstance = this.loadDiagramTask.perform(
      loadMetadataTaskInstance
    );
    const loadedDiagram = this.loadDiagramTask.lastSuccessful?.value;

    return {
      loadMetadataTaskInstance,
      loadedMetadata,
      loadDiagramTaskInstance,
      loadedDiagram,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadBpmnFileTask(fileId) {
    return yield this.store.findRecord('file', fileId, {
      include: 'publisher',
    });
  }

  @task
  *loadDiagramTask(loadMetadataTaskInstance) {
    yield waitForProperty(loadMetadataTaskInstance, 'isFinished');
    const fileId = loadMetadataTaskInstance.value.id;

    const url = generateBpmnDownloadUrl(fileId);
    const response = yield fetch(url);
    if (!response.ok) throw Error(response.status);
    return yield response.text();
  }
}
