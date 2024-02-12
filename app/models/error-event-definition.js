import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class ErrorEventDefinitionModel extends BpmnElementModel {
  type = BpmnElementTypes.ErrorEventDefinition;
}
