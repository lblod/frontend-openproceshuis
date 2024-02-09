import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class SubProcessModel extends BpmnElementModel {
  @attr('string') ramiLayer;
  @attr('string') view;

  type = BpmnElementTypes.SubProcess;
}
