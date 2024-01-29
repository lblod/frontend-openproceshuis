import { BpmnElementTypes } from '../utils/bpmn-element-types';
import TaskModel from './task';

export default class ScriptTaskModel extends TaskModel {
  type = BpmnElementTypes.ScriptTask;
}
