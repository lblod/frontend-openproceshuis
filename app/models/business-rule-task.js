import { BpmnElementTypes } from '../utils/bpmn-element-types';
import TaskModel from './task';

export default class BusinessRuleTaskModel extends TaskModel {
  type = BpmnElementTypes.BusinessRuleTask;
}
