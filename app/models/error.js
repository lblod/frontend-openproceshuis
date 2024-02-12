import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class ErrorModel extends BpmnElementModel {
  type = BpmnElementTypes.Error;
}
