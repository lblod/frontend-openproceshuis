import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class LaneSetModel extends BpmnElementModel {
  type = BpmnElementTypes.LaneSet;
}
