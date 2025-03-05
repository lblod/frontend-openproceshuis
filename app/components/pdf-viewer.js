import Component from '@glimmer/component';
import { action } from '@ember/object';
import pdfjsLib from 'pdfjs-dist/build/pdf';
import { generateVisioConversionUrl } from 'frontend-openproceshuis/utils/file-download-url';

export default class PdfViewerComponent extends Component {
  // Pan state
  isPanning = false;
  startX = 0;
  startY = 0;
  lastX = 0;
  lastY = 0;

  // Zoom state
  scale = 1;
  minScale = 0.5;
  maxScale = 4;
  zoomStep = 0.2;

  // PDF data
  page = null;
  pdfWidth = 0;
  pdfHeight = 0;
  container = null;
  canvas = null;

  constructor() {
    super(...arguments);

    // PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  @action
  async setupViewer(container) {
    this.container = container;
    container.tabIndex = 0; // Make container focusable

    // Basic container styling
    container.style.position = 'relative';
    container.style.overflow = 'hidden'; // No scrollbars, we'll handle panning
    container.style.userSelect = 'none';

    // Create a canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0px';
    this.canvas.style.top = '0px';
    container.appendChild(this.canvas);

    // If there's no visio file, exit
    const visioFileId = this.args.diagram?.isVisioFile
      ? this.args.diagram.id
      : undefined;
    if (!visioFileId) return;

    // Fetch and parse the PDF
    const url = generateVisioConversionUrl(visioFileId);
    const pdf = await pdfjsLib.getDocument(url).promise;
    this.page = await pdf.getPage(1);

    // Get the PDF's "natural" size (width, height) at scale=1
    const viewportAtOne = this.page.getViewport({ scale: 1 });
    this.pdfWidth = viewportAtOne.width;
    this.pdfHeight = viewportAtOne.height;

    // Calculate the initial scale to fill exactly one dimension
    this.calculateInitialScale();

    // Render the PDF at the chosen initial scale
    await this.renderPdf();

    // Position the canvas so it's top-left aligned (no offset)
    this.lastX = 0;
    this.lastY = 0;
    this.updateCanvasTransform();

    // Set up mouse panning and wheel-based actions
    this.setupPanEvents();
    this.setupWheelEvents();
  }

  /**
   * Compare aspect ratios of PDF vs. container
   * to scale so that at least one dimension is 'filled' (width or height).
   */
  calculateInitialScale() {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    const pdfAspect = this.pdfWidth / this.pdfHeight;
    const containerAspect = containerWidth / containerHeight;

    // If PDF is "wider" (aspect >= container's), fill container width.
    // Otherwise, fill container height.
    if (pdfAspect >= containerAspect) {
      this.scale = containerWidth / this.pdfWidth;
    } else {
      this.scale = containerHeight / this.pdfHeight;
    }
  }

  /**
   * Re-renders the PDF at the current `this.scale` onto the canvas.
   * This ensures crisp quality at all zoom levels.
   */
  async renderPdf() {
    // Resize the canvas to the new scaled size
    const scaledWidth = this.pdfWidth * this.scale;
    const scaledHeight = this.pdfHeight * this.scale;
    this.canvas.width = scaledWidth;
    this.canvas.height = scaledHeight;

    const context = this.canvas.getContext('2d');
    const viewport = this.page.getViewport({ scale: this.scale });

    await this.page.render({
      canvasContext: context,
      viewport,
    }).promise;
  }

  /**
   * Update the canvas' CSS transform to reflect
   * the current `this.lastX`, `this.lastY` for panning (no scale transform needed
   * because the PDF is re-rendered at the new scale).
   */
  updateCanvasTransform() {
    this.canvas.style.transform = `translate(${this.lastX}px, ${this.lastY}px)`;
  }

  /**
   * Mouse-based panning (dragging with left-click).
   */
  setupPanEvents() {
    let dragStartX, dragStartY;

    const onMouseDown = (event) => {
      this.isPanning = true;
      // Record the offset between the mouse and the current translation
      dragStartX = event.clientX - this.lastX;
      dragStartY = event.clientY - this.lastY;
    };

    const onMouseMove = (event) => {
      if (!this.isPanning) return;

      this.lastX = event.clientX - dragStartX;
      this.lastY = event.clientY - dragStartY;

      this.updateCanvasTransform();
    };

    const onMouseUp = () => {
      this.isPanning = false;
    };

    // Attach to container
    this.container.addEventListener('mousedown', onMouseDown);
    this.container.addEventListener('mousemove', onMouseMove);
    this.container.addEventListener('mouseup', onMouseUp);
    this.container.addEventListener('mouseleave', onMouseUp);
  }

  /**
   * Wheel-based scrolling and zooming:
   * - Ctrl+Scroll = zoom in/out (centered at cursor)
   * - Shift+Scroll = pan left/right
   * - Normal Scroll = pan up/down
   */
  setupWheelEvents() {
    this.container.addEventListener('wheel', async (event) => {
      event.preventDefault(); // Prevent browser scroll

      if (event.ctrlKey) {
        // Zoom in or out, centered at mouse
        await this.handleZoom(event);
      } else if (event.shiftKey) {
        // Shift + Scroll => horizontal movement
        this.lastX -= event.deltaY;
        this.updateCanvasTransform();
      } else {
        // Normal scroll => vertical movement
        this.lastY -= event.deltaY;
        this.updateCanvasTransform();
      }
    });
  }

  /**
   * Zoom in or out, re-render PDF at the new scale,
   * and keep the cursor in the same PDF location before/after zoom.
   */
  async handleZoom(event) {
    // Decide zoom direction
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    const oldScale = this.scale;
    let newScale = oldScale * (1 + zoomDirection * this.zoomStep);

    // Clamp the scale
    newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
    if (newScale === oldScale) {
      return; // No zoom change
    }

    // **1) Figure out which PDF coordinate is under the cursor**
    const containerRect = this.container.getBoundingClientRect();
    // Convert mouse from container coordinates to unscaled PDF coordinates
    const mouseXInPdfCoords =
      (event.clientX - containerRect.left - this.lastX) / oldScale;
    const mouseYInPdfCoords =
      (event.clientY - containerRect.top - this.lastY) / oldScale;

    // **2) Update scale & re-render at that scale** (ensures crisp text)
    this.scale = newScale;
    await this.renderPdf();

    // **3) Calculate new translation so (mouseXInPdfCoords, mouseYInPdfCoords)
    //      remains under the cursor at (event.clientX, event.clientY).**
    this.lastX =
      event.clientX - containerRect.left - mouseXInPdfCoords * this.scale;
    this.lastY =
      event.clientY - containerRect.top - mouseYInPdfCoords * this.scale;

    // **4) Update transform for panning**
    this.updateCanvasTransform();
  }
}
