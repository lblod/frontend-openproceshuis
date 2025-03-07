import Component from '@glimmer/component';
import { action } from '@ember/object';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { restartableTask } from 'ember-concurrency';
import generateFileDownloadUrl from 'frontend-openproceshuis/utils/file-download-url';

export default class BpmnViewerComponent extends Component {
  viewer = null;

  @action
  async setupViewer(container) {
    container.tabIndex = 0;
    this.viewer = new NavigatedViewer({ container: container });

    const bpmnFileId = this.args.diagram?.isBpmnFile
      ? this.args.diagram.id
      : undefined;
    if (!bpmnFileId) return;

    const bpmnXml = await this.downloadBpmnFile.perform(bpmnFileId);
    if (!bpmnXml) return;

    await this.viewer.importXML(bpmnXml);
    this.viewer.get('canvas').zoom('fit-viewport');
    this.disableZoomScroll();

    container.addEventListener('focus', () => {
      this.enableZoomScroll();
    });

    container.addEventListener('blur', () => {
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
    const response = yield fetch(url);
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
