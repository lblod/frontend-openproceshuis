import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class PropertyModel extends BpmnElementModel {
  @attr('string') propertyElement;

  type = BpmnElementTypes.Property;
}
