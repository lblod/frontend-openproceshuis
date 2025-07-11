import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { restartableTask } from 'ember-concurrency';
import generateFileDownloadUrl from 'frontend-openproceshuis/utils/file-download-url';

export default class BpmnViewerModifier extends Modifier {
  viewer = null;
  lastFileId = null;
  zoomStep = 0.2;

  downloadXml = restartableTask(async (fileId) => {
    const url = generateFileDownloadUrl(fileId);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  });

  constructor(owner, args) {
    super(owner, args);
    registerDestructor(this, () => this.viewer?.destroy());
  }

  async modify(
    container,
    _,
    { diagram, onBpmnLoaded, onSvgLoaded, onError, registerApi },
  ) {
    container.tabIndex = 0;

    if (!this.viewer) {
      this.viewer = new NavigatedViewer({ container });
      container.addEventListener('focus', () => this.enableZoomScroll());
      container.addEventListener('blur', () => this.disableZoomScroll());
    }

    if (registerApi) {
      registerApi({
        zoomIn: this.zoomIn.bind(this),
        zoomOut: this.zoomOut.bind(this),
      });
    }

    const fileId = diagram?.isBpmnFile && diagram.id;
    if (!fileId || fileId === this.lastFileId) return;
    this.lastFileId = fileId;

    onError?.(false);

    try {
      const xml = await this.downloadXml.perform(fileId);

      await this.viewer.importXML(xml);

      this.viewer.get('canvas').zoom('fit-viewport');
      this.disableZoomScroll();

      onBpmnLoaded?.(xml);

      if (onSvgLoaded) {
        const { svg } = await this.viewer.saveSVG();
        onSvgLoaded(svg);
      }
    } catch (err) {
      console.error('BPMN load/display error:', err);
      onError?.(true);
    }
  }

  enableZoomScroll() {
    this.viewer?.get('zoomScroll').toggle(true);
  }
  disableZoomScroll() {
    this.viewer?.get('zoomScroll').toggle(false);
  }

  zoomIn = () => {
    const canvas = this.viewer?.get('canvas');
    if (!canvas) return;

    const currentZoom = canvas.zoom();
    canvas.zoom(currentZoom + this.zoomStep);
  };

  zoomOut = () => {
    const canvas = this.viewer?.get('canvas');
    if (!canvas) return;

    const currentZoom = canvas.zoom();
    canvas.zoom(currentZoom - this.zoomStep);
  };
}
