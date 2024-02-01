import { BpmnElementTypes } from '../utils/bpmn-element-types';
import TaskModel from './task';

export default class ServiceTaskModel extends TaskModel {
  type = BpmnElementTypes.ServiceTask;
}
