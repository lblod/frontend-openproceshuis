import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class TaskModel extends BpmnElementModel {
  type = BpmnElementTypes.Task;
}
