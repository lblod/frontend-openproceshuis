import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import BpmnViewerModifier from './bpmn-viewer';

export default class BpmnViewerComponent extends Component {
  bpmnViewer = BpmnViewerModifier;

  @tracked hasError = false;

  setError = (flag) => {
    this.hasError = flag;
  };
}
