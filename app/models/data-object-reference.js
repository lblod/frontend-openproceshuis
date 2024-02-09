import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class DataObjectReferenceModel extends BpmnElementModel {
  type = BpmnElementTypes.DataObjectReference;
}
