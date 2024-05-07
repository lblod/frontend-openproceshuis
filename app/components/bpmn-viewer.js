import Component from '@glimmer/component';
import { action } from '@ember/object';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

export default class BpmnViewerComponent extends Component {
  @action
  async setupViewer(element) {
    element.tabIndex = 0; // Make element focusable

    const viewer = new NavigatedViewer({ container: element });

    const bpmnXml = this.args.bpmnXml;
    if (bpmnXml) {
      await viewer.importXML(bpmnXml);
      viewer.get('canvas').zoom('fit-viewport');
    }
  }
}
