import { BpmnElementTypes } from '../utils/bpmn-element-types';
import BpmnElementModel from './bpmn-element';

export default class ExclusiveGatewayModel extends BpmnElementModel {
  type = BpmnElementTypes.ExclusiveGateway;
}
