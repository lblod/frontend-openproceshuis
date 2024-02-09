import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class PropertyModel extends BpmnElementModel {
  type = BpmnElementTypes.Property;
}
