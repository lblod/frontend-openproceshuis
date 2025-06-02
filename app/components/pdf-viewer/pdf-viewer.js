import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';
import { restartableTask } from 'ember-concurrency';
import pdfjsLib from 'pdfjs-dist/build/pdf';
import { generateVisioConversionUrl } from 'frontend-openproceshuis/utils/file-download-url';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default class PdfViewerModifier extends Modifier {
  pdf = null;
  page = null;
  canvas = null;
  lastFileId = null;
  lastRenderedPage = null;
  currentRenderTask = null;

  offsetX = 0;
  offsetY = 0;
  scale = 1;
  minScale = 0.5;
  maxScale = 4;
  zoomStep = 0.2;
  isPanning = false;
  panStartX = 0;
  panStartY = 0;

  loadPdf = restartableTask(async (fileId) => {
    const url = generateVisioConversionUrl(fileId);
    this.pdf = await pdfjsLib.getDocument(url).promise;
    return {
      totalPages: this.pdf.numPages,
      firstPage: await this.pdf.getPage(1),
    };
  });

  constructor(owner, args) {
    super(owner, args);
    registerDestructor(this, () => {
      if (this.canvas) {
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('wheel', this.onWheel, {
          passive: false,
        });
      }
    });
  }

  async modify(
    container,
    _,
    {
      diagram,
      currentPage,
      onLoadingChange,
      onPageChange,
      onTotalPages,
      onError,
    },
  ) {
    container.tabIndex = 0;
    container.style.overflow = 'hidden';
    container.style.position = 'relative';
    container.style.userSelect = 'none';

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      Object.assign(this.canvas.style, {
        position: 'absolute',
        left: '0px',
        top: '0px',
      });
      container.appendChild(this.canvas);

      this.canvas.addEventListener('mousedown', this.onMouseDown);
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
      this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }

    const fileId = diagram?.isVisioFile && diagram.id;
    if (!fileId) return;

    onError?.(false);

    if (fileId !== this.lastFileId) {
      this.lastFileId = fileId;
      this.lastRenderedPage = null;

      onLoadingChange(true);
      let { totalPages, firstPage } = await this.loadPdf.perform(fileId);
      onTotalPages(totalPages);
      onPageChange(1);

      try {
        await this._fitPdf(container, firstPage);
      } catch (err) {
        console.error('Visio display error:', err);
        onError?.(true);
      }
      onLoadingChange(false);
    }

    if (currentPage && currentPage !== this.lastRenderedPage) {
      this.lastRenderedPage = currentPage;
      onLoadingChange(true);

      try {
        this.page = await this.pdf.getPage(currentPage);
        await this._renderAtScale(this.scale);
        this._updateCanvasTransform();
      } catch (err) {
        console.error('Visio display error:', err);
        onError?.(true);
      }

      onLoadingChange(false);
    }
  }

  async _fitPdf(container, page) {
    this.page = page;
    const viewport = page.getViewport({ scale: 1 });
    const pad = 3;
    const cw = container.clientWidth - pad;
    const ch = container.clientHeight - pad;
    const scale = Math.min(cw / viewport.width, ch / viewport.height);

    this.scale = scale;
    this.offsetX = pad;
    this.offsetY = pad;

    await this._renderAtScale(scale);
    this._updateCanvasTransform();
  }

  async _renderAtScale(scale) {
    const viewport = this.page.getViewport({ scale });
    const context = this.canvas.getContext('2d');
    const outputScale = (window.devicePixelRatio || 1) * 1.5;

    this.canvas.style.width = `${viewport.width}px`;
    this.canvas.style.height = `${viewport.height}px`;
    this.canvas.width = Math.floor(viewport.width * outputScale);
    this.canvas.height = Math.floor(viewport.height * outputScale);

    if (this.currentRenderTask) {
      this.currentRenderTask.cancel();
      this.currentRenderTask = null;
    }

    let renderTask = this.page.render({
      canvasContext: context,
      viewport,
      transform:
        outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
    });
    this.currentRenderTask = renderTask;

    try {
      await renderTask.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        throw err;
      }
    } finally {
      if (this.currentRenderTask === renderTask) {
        this.currentRenderTask = null;
      }
    }
  }

  onMouseDown = (event) => {
    this.isPanning = true;
    this.panStartX = event.clientX - this.offsetX;
    this.panStartY = event.clientY - this.offsetY;
  };

  onMouseMove = (event) => {
    if (!this.isPanning) return;
    this.offsetX = event.clientX - this.panStartX;
    this.offsetY = event.clientY - this.panStartY;
    this._updateCanvasTransform();
  };

  onMouseUp = () => {
    this.isPanning = false;
  };

  onWheel = async (event) => {
    event.preventDefault();

    if (event.ctrlKey) {
      await this._zoomOnCursor(event);
    } else if (event.shiftKey) {
      this.offsetX -= event.deltaY;
      this._updateCanvasTransform();
    } else {
      this.offsetY -= event.deltaY;
      this._updateCanvasTransform();
    }
  };

  async _zoomOnCursor(event) {
    const zoomOut = event.deltaY > 0;
    const oldScale = this.scale;
    let newScale = oldScale * (zoomOut ? 1 - this.zoomStep : 1 + this.zoomStep);

    newScale = Math.min(this.maxScale, Math.max(this.minScale, newScale));
    if (newScale === oldScale) return;

    const rect = this.canvas.parentElement.getBoundingClientRect();
    const mx = (event.clientX - rect.left - this.offsetX) / oldScale;
    const my = (event.clientY - rect.top - this.offsetY) / oldScale;

    this.scale = newScale;
    await this._renderAtScale(newScale);

    this.offsetX = event.clientX - rect.left - mx * newScale;
    this.offsetY = event.clientY - rect.top - my * newScale;
    this._updateCanvasTransform();
  }

  _updateCanvasTransform() {
    this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
  }
}
