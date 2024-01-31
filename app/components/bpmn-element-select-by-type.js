import Component from '@glimmer/component';
import { BpmnElementTypes } from '../utils/bpmn-element-types';

export default class BpmnElementSelectByTypeComponent extends Component {
  get types() {
    return Object.values(BpmnElementTypes)
      .filter((type) => type !== BpmnElementTypes.BpmnElement)
      .sort();
  }
}
