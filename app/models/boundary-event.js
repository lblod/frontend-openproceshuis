import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class BoundaryEventModel extends BpmnElementModel {
  @attr('string') reference;
  @attr('string') outgoing;
  @attr('string') eventDefinition;
}
