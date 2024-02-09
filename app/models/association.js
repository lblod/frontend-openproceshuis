import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class AssociationModel extends BpmnElementModel {
  type = BpmnElementTypes.Association;
}
