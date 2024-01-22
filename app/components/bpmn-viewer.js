import Component from '@glimmer/component';
import { action } from '@ember/object';
import BpmnViewer from 'bpmn-js';

export default class BpmnViewerComponent extends Component {
  @action
  async setupViewer(element) {
    const viewer = new BpmnViewer({ container: element });

    const bpmnXml = this.args.bpmnXml;
    if (bpmnXml) {
      await viewer.importXML(bpmnXml);
      viewer.get('canvas').zoom('fit-viewport');
    }
  }
}
