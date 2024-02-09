import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class DataInputAssociationModel extends BpmnElementModel {
  type = BpmnElementTypes.DataInputAssocation;
}
