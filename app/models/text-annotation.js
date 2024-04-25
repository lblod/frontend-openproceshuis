import BpmnElementModel from './bpmn-element';
import { attr } from '@ember-data/model';

export default class TextAnnotationModel extends BpmnElementModel {
  @attr('string') comment;
}
