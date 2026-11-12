import Component from '@glimmer/component';

export default class ConfigurableColumnsAdvancedTable extends Component {
  get model() {
    return this.args.model ?? [];
  }

  get columns() {
    return this.args.columns ?? [];
  }

  get stickyColumnCount() {
    if (this.args.stickyColumnCount != null) {
      return this.args.stickyColumnCount;
    }

    return this.args.hasStickyFirstColumn ? 1 : 0;
  }

  get isLoading() {
    return this.args.isLoading ?? false;
  }

  get page() {
    return this.args.page ?? 0;
  }

  set page(page) {
    this.args.onPageChange?.(page);
  }

  get size() {
    return this.args.size ?? 20;
  }

  set size(size) {
    this.args.onSizeChange?.(size);
  }

  get sort() {
    return this.args.sort ?? '';
  }

  set sort(sort) {
    this.args.onSortChange?.(sort);
  }
}
