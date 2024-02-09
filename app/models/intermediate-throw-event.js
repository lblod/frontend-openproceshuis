import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class IntermediateThrowEventModel extends BpmnElementModel {
  @attr('string') eventDefinition;
  @attr('string') outgoing;
  @attr('string') incoming;

  type = BpmnElementTypes.IntermediateThrowEvent;
}
