import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class StartEventModel extends BpmnElementModel {
  type = BpmnElementTypes.StartEvent;
}
