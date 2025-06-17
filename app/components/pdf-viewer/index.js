import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import PdfViewerModifier from './pdf-viewer';

export default class PdfViewerComponent extends Component {
  pdfViewer = PdfViewerModifier;

  @tracked isLoading = true;
  @tracked currentPage = 1;
  @tracked totalPages = 1;
  @tracked hasError = false;

  setLoading = (flag) => {
    this.isLoading = flag;
  };
  setPage = (num) => {
    this.currentPage = num;
  };
  setTotal = (num) => {
    this.totalPages = num;
  };
  setError = (flag) => {
    this.hasError = flag;
  };

  @action
  goToPrevious() {
    if (this.currentPage > 1) this.setPage(this.currentPage - 1);
  }

  @action
  goToNext() {
    if (this.currentPage < this.totalPages) this.setPage(this.currentPage + 1);
  }
}
