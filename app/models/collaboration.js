import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class CollaborationModel extends BpmnElementModel {
  type = BpmnElementTypes.Collaboration;
}
