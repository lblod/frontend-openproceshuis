import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class SequenceFlowModel extends BpmnElementModel {
  type = BpmnElementTypes.SequenceFlow;
}
