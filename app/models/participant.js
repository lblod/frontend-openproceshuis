import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class ParticipantModel extends BpmnElementModel {
  @attr('string') process;
}
