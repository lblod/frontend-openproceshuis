import Route from '@ember/routing/route';
import generateBpmnDownloadUrl from 'frontend-processendatabank/utils/bpmn-download-url';

export default class BpmnFilesBpmnFileIndexRoute extends Route {
  async model() {
    let metadata = this.modelFor('bpmn-files.bpmn-file');
    let diagram = await this.fetchBpmnXml(metadata.id);

    return { metadata, diagram };
  }

  async fetchBpmnXml(id) {
    const url = generateBpmnDownloadUrl(id);
    const response = await fetch(url);
    return await response.text();
  }
}
