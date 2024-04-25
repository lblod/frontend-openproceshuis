import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class InclusiveGatewayModel extends BpmnElementModel {
  @attr('string') defaultElement;
  @attr('string') outgoing;
  @attr('string') incoming;
}
