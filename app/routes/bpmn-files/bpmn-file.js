import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class BpmnFilesBpmnFileRoute extends Route {
  @service store;

  async model() {
    let { id: fileId } = this.paramsFor('bpmn-files.bpmn-file');

    return await this.store.findRecord('file', fileId);
  }
}
