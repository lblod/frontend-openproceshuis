import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class DataObjectModel extends BpmnElementModel {
  type = BpmnElementTypes.DataObject;
}
