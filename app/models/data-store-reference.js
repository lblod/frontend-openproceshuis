import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class DataStoreReferenceModel extends BpmnElementModel {
  type = BpmnElementTypes.DataStoreReference;
}
