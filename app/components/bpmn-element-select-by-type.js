import Component from '@glimmer/component';

export default class BpmnElementSelectByTypeComponent extends Component {
  get types() {
    return ['start-event', 'end-event'];
  }
}
