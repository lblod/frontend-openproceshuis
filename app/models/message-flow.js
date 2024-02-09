import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class MessageFlowModel extends BpmnElementModel {
  type = BpmnElementTypes.MessageFlow;
}
