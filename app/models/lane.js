import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class LaneModel extends BpmnElementModel {
  @attr('string') activity;

  type = BpmnElementTypes.Lane;
}
