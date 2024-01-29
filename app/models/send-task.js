import { BpmnElementTypes } from '../utils/bpmn-element-types';
import TaskModel from './task';

export default class SendTaskModel extends TaskModel {
  type = BpmnElementTypes.SendTask;
}
