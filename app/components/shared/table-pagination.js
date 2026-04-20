import Component from '@glimmer/component';

import { service } from '@ember/service';
import { action } from '@ember/object';

export default class SharedTablePagination extends Component {
  @service router;

  get page() {
    const multiplierItems = this.currentPage + 1;
    let topItems = multiplierItems * this.itemsPerPage;
    let bottomItems = topItems - this.itemsPerPage;

    if (topItems > this.totalItems) {
      topItems = this.totalItems;
    }

    if (this.totalItems !== 0) {
      bottomItems++;
    }

    return `${bottomItems} - ${topItems}`;
  }

  get totalItems() {
    return this.args.metadata?.count || 0;
  }

  get currentPage() {
    return this.args.metadata?.pagination?.self?.number || this.firstPage;
  }

  get itemsPerPage() {
    return this.args.metadata?.pagination?.self?.size || 20;
  }

  get firstPage() {
    return this.args.metadata?.pagination?.first?.number || 0;
  }

  get lastPage() {
    return this.args.metadata?.pagination?.last?.number || this.firstPage;
  }

  get previousPage() {
    if (this.currentPage - 1 >= this.firstPage) {
      return this.currentPage - 1;
    }

    return this.firstPage;
  }

  get nextPage() {
    if (this.currentPage + 1 <= this.lastPage) {
      return this.currentPage + 1;
    }

    return this.args.metadata?.pagination?.next?.number ?? this.lastPage;
  }

  get isPreviousButtonHidden() {
    return this.currentPage === this.firstPage;
  }

  get isNextButtonHidden() {
    return this.currentPage === this.lastPage;
  }

  @action
  onClickPrevious() {
    this.router.transitionTo({
      queryParams: { [this.pageQueryParamName]: this.previousPage },
    });
  }

  @action
  onClickNext() {
    this.router.transitionTo({
      queryParams: { [this.pageQueryParamName]: this.nextPage },
    });
  }

  get pageQueryParamName() {
    return this.args.pageQueryParamName || 'page';
  }
}
