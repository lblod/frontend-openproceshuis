import Component from '@glimmer/component';
import { BpmnElementTypes } from '../utils/bpmn-element-types';

export default class BpmnFileSelectByTypeComponent extends Component {
  types = [
    BpmnElementTypes.BusinessRuleTask,
    BpmnElementTypes.ManualTask,
    BpmnElementTypes.ReceiveTask,
    BpmnElementTypes.ScriptTask,
    BpmnElementTypes.SendTask,
    BpmnElementTypes.Task,
    BpmnElementTypes.UserTask,
  ].sort();
}
