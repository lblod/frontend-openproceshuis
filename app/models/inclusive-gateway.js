import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class InclusiveGatewayModel extends BpmnElementModel {
  type = BpmnElementTypes.InclusiveGateway;
}
