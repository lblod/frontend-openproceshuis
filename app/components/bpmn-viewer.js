import Component from '@glimmer/component';
import { action } from '@ember/object';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { restartableTask } from 'ember-concurrency';
import generateFileDownloadUrl from 'frontend-openproceshuis/utils/file-download-url';

export default class BpmnViewerComponent extends Component {
  viewer = null;

  @action
  async setupViewer(element) {
    element.tabIndex = 0; // Make element focusable
    this.viewer = new NavigatedViewer({ container: element });

    const bpmnFile = this.args.bpmnFile;
    if (!bpmnFile) return;

    const bpmnXml = await this.downloadBpmnFile.perform(bpmnFile.id);
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

    if (this.args.onBpmnLoaded) this.args.onBpmnLoaded(bpmnXml);
    if (this.args.onSvgLoaded) {
      const { svg } = await this.viewer.saveSVG();
      this.args.onSvgLoaded(svg);
    }
  }

  @restartableTask
  *downloadBpmnFile(bpmnFileId) {
    const url = generateFileDownloadUrl(bpmnFileId);
    const response = yield fetch(url, {
      headers: {
        Accept: 'text/xml',
      },
    });
    if (!response.ok) throw Error(response.status);
    return yield response.text();
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
