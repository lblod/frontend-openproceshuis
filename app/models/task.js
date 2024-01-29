import BpmnElementModel from './bpmn-element';

export default class TaskModel extends BpmnElementModel {
  get type() {
    return 'Taak';
  }
}
