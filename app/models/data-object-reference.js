import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class DataObjectReferenceModel extends BpmnElementModel {
  @attr('string') reference;

  type = BpmnElementTypes.DataObjectReference;
}
