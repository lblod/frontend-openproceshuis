import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class IntermediateThrowEventModel extends BpmnElementModel {
  type = BpmnElementTypes.IntermediateThrowEvent;
}
