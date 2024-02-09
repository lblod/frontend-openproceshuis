import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class SequenceFlowModel extends BpmnElementModel {
  @attr('string') source;
  @attr('string') target;

  type = BpmnElementTypes.SequenceFlow;
}
