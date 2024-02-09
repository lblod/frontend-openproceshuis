import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class SubProcessModel extends BpmnElementModel {
  type = BpmnElementTypes.SubProcess;
}
