import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class StartEventModel extends BpmnElementModel {
  @attr('string') outgoing;
}
