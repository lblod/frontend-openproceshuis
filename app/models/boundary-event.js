import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class BoundaryEventModel extends BpmnElementModel {
  type = BpmnElementTypes.BoundaryEvent;
}
