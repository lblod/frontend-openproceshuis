import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ProcessesIndexController extends Controller {
  filters = [
    'blueprint',
    'title',
    'modifiedSince',
    'classification',
    'group',
    'creator',
    'ipdc',
  ];
  columns = [
    'title',
    'description',
    'modified',
    'classification',
    'organization',
    'creator',
  ];

  queryParams = [
    'page',
    'size',
    'sort',
    'title',
    'modifiedSince',
    'classifications',
    'group',
    'creator',
    'blueprint',
    'ipdcProducts',
  ];

  @tracked page = 0;
  @tracked size = 20;
  @tracked sort = 'title';
  @tracked title = '';
  @tracked modifiedSince = undefined;
  @tracked classifications = undefined;
  @tracked selectedClassifications = undefined;
  @tracked selectedIpdcProducts = undefined;
  @tracked ipdcProducts = undefined;
  @tracked group = '';
  @tracked creator = '';
  @tracked blueprint = false;

  get query() {
    return {
      page: this.page,
      size: this.size,
      sort: this.sort,
      title: this.title,
      modifiedSince: this.modifiedSince,
      classifications: this.classifications,
      selectedClassifications: this.selectedClassifications,
      group: this.group,
      creator: this.creator,
      blueprint: this.blueprint,
      ipdcProducts: this.ipdcProducts,
      selectedIpdcProducts: this.selectedIpdcProducts,
    };
  }

  @action
  updateQuery(query) {
    this.page = query.page;
    this.size = query.size;
    this.sort = query.sort;
    this.title = query.title;
    this.modifiedSince = query.modifiedSince;
    this.classifications = query.classifications;
    this.selectedClassifications = query.selectedClassifications;
    this.group = query.group;
    this.creator = query.creator;
    this.blueprint = query.blueprint;
    this.ipdcProducts = query.ipdcProducts;
    this.selectedIpdcProducts = query.selectedIpdcProducts;
  }
}
