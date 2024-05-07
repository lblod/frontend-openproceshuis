import Component from '@glimmer/component';
import { action } from '@ember/object';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

export default class BpmnViewerComponent extends Component {
  viewer = null;

  @action
  async setupViewer(element) {
    element.tabIndex = 0; // Make element focusable
    this.viewer = new NavigatedViewer({ container: element });

    const bpmnXml = this.args.bpmnXml;
    if (!bpmnXml) return;

    await this.viewer.importXML(bpmnXml);
    this.viewer.get('canvas').zoom('fit-viewport');
    this.disableZoomScroll();

    element.addEventListener('focus', () => {
      this.enableZoomScroll();
    });

    element.addEventListener('blur', () => {
      this.disableZoomScroll();
    });
  }

  enableZoomScroll() {
    if (!this.viewer) return;
    const zoomScroll = this.viewer.get('zoomScroll');
    zoomScroll.toggle(true);
  }

  disableZoomScroll() {
    if (!this.viewer) return;
    const zoomScroll = this.viewer.get('zoomScroll');
    zoomScroll.toggle(false);
  }
}
