import Route from '@ember/routing/route';

export default class BpmnFilesBpmnFileIndexRoute extends Route {
  model() {
    return this.modelFor('bpmn-files.bpmn-file');
  }
}
