import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class DataOutputAssociationModel extends BpmnElementModel {
  @attr('string') target;
  @attr('string') dataOutputFrom;

  type = BpmnElementTypes.DataOutputAssocation;
}
