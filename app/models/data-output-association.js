import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class DataOutputAssociationModel extends BpmnElementModel {
  type = BpmnElementTypes.DataOutputAssocation;
}
