import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class EndEventModel extends BpmnElementModel {
  @attr('string') incoming;

  type = BpmnElementTypes.EndEvent;
}
