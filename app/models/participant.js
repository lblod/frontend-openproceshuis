import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class ParticipantModel extends BpmnElementModel {
  @attr('string') process;

  type = BpmnElementTypes.Participant;
}
