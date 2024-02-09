import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class TextAnnotationModel extends BpmnElementModel {
  type = BpmnElementTypes.TextAnnotation;
}
