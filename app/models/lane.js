import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class LaneModel extends BpmnElementModel {
  type = BpmnElementTypes.Lane;
}
