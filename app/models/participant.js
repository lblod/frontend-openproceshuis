import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class ParticipantModel extends BpmnElementModel {
  type = BpmnElementTypes.Participant;
}
