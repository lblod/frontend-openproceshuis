import Component from '@glimmer/component';
import BpmnViewerModifier from './bpmn-viewer';

export default class BpmnViewerComponent extends Component {
  bpmnViewer = BpmnViewerModifier;
}
