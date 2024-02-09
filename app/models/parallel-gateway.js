import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class ParallelGatewayModel extends BpmnElementModel {
  type = BpmnElementTypes.ParallelGateway;
}
