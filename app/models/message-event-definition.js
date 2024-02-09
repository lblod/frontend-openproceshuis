import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class MessageEventDefinitionModel extends BpmnElementModel {
  type = BpmnElementTypes.MessageEventDefinition;
}
