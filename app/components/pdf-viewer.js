import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';
import pdfjsLib from 'pdfjs-dist/build/pdf';
import { generateVisioConversionUrl } from 'frontend-openproceshuis/utils/file-download-url';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default class PdfViewerComponent extends Component {
  pdf = null;
  page = null;
  container = null;
  canvas = null;
  currentRenderTask = null;
  @tracked isLoading = true;

  @tracked currentPage = 1;
  @tracked totalPages = 1;

  isPanning = false;
  panStartX = 0;
  panStartY = 0;
  offsetX = 0;
  offsetY = 0;
  initialPadding = 3;

  scale = 1;
  minScale = 0.5;
  maxScale = 4;
  zoomStep = 0.2;
  zoomScrollEnabled = false;

  @action
  async setupViewer(container) {
    container.tabIndex = 0;
    this.container = container;

    container.style.overflow = 'hidden';
    container.style.position = 'relative';
    container.style.userSelect = 'none';

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0px';
    this.canvas.style.top = '0px';
    container.appendChild(this.canvas);

    const visioFileId = this.args.diagram?.isVisioFile
      ? this.args.diagram.id
      : undefined;
    if (!visioFileId) return;

    await this.loadPdfTask.perform(visioFileId);
    console.log('loading pdf done');

    await this.fitPdfToContainer();
    console.log('fitting pdf done');
    this.isLoading = false;

    this.disableZoomScroll();

    container.addEventListener('focus', () => {
      this.enableZoomScroll();
    });
    container.addEventListener('blur', () => {
      this.disableZoomScroll();
    });
  }

  @restartableTask
  *loadPdfTask(fileId) {
    const url = generateVisioConversionUrl(fileId);
    this.pdf = yield pdfjsLib.getDocument(url).promise;
    this.totalPages = this.pdf.numPages;

    this.currentPage = 1;
    this.page = yield this.pdf.getPage(this.currentPage);
  }

  async fitPdfToContainer() {
    const unscaledViewport = this.page.getViewport({ scale: 1 });
    const pdfWidth = unscaledViewport.width;
    const pdfHeight = unscaledViewport.height;

    const containerWidth = this.container.clientWidth - this.initialPadding;
    const containerHeight = this.container.clientHeight - this.initialPadding;

    const scaleX = containerWidth / pdfWidth;
    const scaleY = containerHeight / pdfHeight;
    this.scale = Math.min(scaleX, scaleY);

    await this.renderPdfAtScale(this.scale);

    this.offsetX = this.initialPadding;
    this.offsetY = this.initialPadding;
    this.updateCanvasTransform();
  }

  async renderPdfAtScale(newScale) {
    if (this.currentRenderTask) {
      this.currentRenderTask.cancel();
      this.currentRenderTask = null;
    }

    const viewport = this.page.getViewport({ scale: newScale });
    const baseDPR = window.devicePixelRatio || 1;
    const outputScale = baseDPR * 1.5;

    this.canvas.style.width = `${viewport.width}px`;
    this.canvas.style.height = `${viewport.height}px`;

    this.canvas.width = Math.floor(viewport.width * outputScale);
    this.canvas.height = Math.floor(viewport.height * outputScale);

    let transform = null;
    if (outputScale !== 1) {
      transform = [outputScale, 0, 0, outputScale, 0, 0];
    }

    const context = this.canvas.getContext('2d');
    const renderTask = this.page.render({
      canvasContext: context,
      viewport,
      transform,
    });
    this.currentRenderTask = renderTask;

    try {
      await renderTask.promise;
    } catch (err) {
      if (err && err.name !== 'RenderingCancelledException') {
        throw err;
      }
    } finally {
      if (this.currentRenderTask === renderTask) {
        this.currentRenderTask = null;
      }
    }
  }

  updateCanvasTransform() {
    this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
  }

  @action
  async goToPreviousPage() {
    if (!this.pdf) return;
    const prevPage = this.currentPage - 1;
    if (prevPage < 1) return;

    await this.goToPage(prevPage);
  }

  @action
  async goToNextPage() {
    if (!this.pdf) return;
    const nextPage = this.currentPage + 1;
    if (nextPage > this.totalPages) return;

    await this.goToPage(nextPage);
  }

  async goToPage(pageNumber) {
    this.currentPage = pageNumber;
    this.page = await this.pdf.getPage(pageNumber);

    await this.renderPdfAtScale(this.scale);

    this.offsetX = this.initialPadding;
    this.offsetY = this.initialPadding;
    this.updateCanvasTransform();
  }

  @action
  enableZoomScroll() {
    this.zoomScrollEnabled = true;
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mouseleave', this.onMouseUp);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
  }

  @action
  disableZoomScroll() {
    this.zoomScrollEnabled = false;
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mouseleave', this.onMouseUp);
    this.container.removeEventListener('wheel', this.onWheel, {
      passive: false,
    });
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
    this.updateCanvasTransform();
  };

  onMouseUp = () => {
    this.isPanning = false;
  };

  onWheel = async (event) => {
    if (!this.zoomScrollEnabled) return;
    event.preventDefault();

    if (event.ctrlKey) {
      await this.zoomOnCursor(event);
    } else if (event.shiftKey) {
      this.offsetX -= event.deltaY;
      this.updateCanvasTransform();
    } else {
      this.offsetY -= event.deltaY;
      this.updateCanvasTransform();
    }
  };

  async zoomOnCursor(event) {
    const zoomOut = event.deltaY > 0;
    const oldScale = this.scale;
    let newScale = oldScale * (zoomOut ? 1 - this.zoomStep : 1 + this.zoomStep);

    newScale = Math.min(this.maxScale, Math.max(this.minScale, newScale));
    if (newScale === oldScale) return;

    const rect = this.container.getBoundingClientRect();
    const mouseXRelative =
      (event.clientX - rect.left - this.offsetX) / oldScale;
    const mouseYRelative = (event.clientY - rect.top - this.offsetY) / oldScale;

    this.scale = newScale;
    await this.renderPdfAtScale(this.scale);

    this.offsetX = event.clientX - rect.left - mouseXRelative * this.scale;
    this.offsetY = event.clientY - rect.top - mouseYRelative * this.scale;

    this.updateCanvasTransform();
  }
}
