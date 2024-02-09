import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class EndEventModel extends BpmnElementModel {
  type = BpmnElementTypes.EndEvent;
}
