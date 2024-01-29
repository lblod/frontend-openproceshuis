import { BpmnElementTypes } from '../utils/bpmn-element-types';
import TaskModel from './task';

export default class ReceiveTaskModel extends TaskModel {
  type = BpmnElementTypes.ReceiveTask;
}
