import { BpmnElementTypes } from '../utils/bpmn-element-types';
import TaskModel from './task';

export default class UserTaskModel extends TaskModel {
  type = BpmnElementTypes.UserTask;
}
