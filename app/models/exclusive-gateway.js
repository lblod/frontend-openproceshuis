import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class ExclusiveGatewayModel extends BpmnElementModel {
  @attr('string') defaultElement;
  @attr('string') outgoing;
  @attr('string') incoming;

  type = BpmnElementTypes.ExclusiveGateway;
}
