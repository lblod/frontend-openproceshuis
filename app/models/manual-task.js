import { BpmnElementTypes } from '../utils/bpmn-element-types';
import TaskModel from './task';

export default class ManualTaskModel extends TaskModel {
  type = BpmnElementTypes.ManualTask;
}
