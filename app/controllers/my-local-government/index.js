import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class MyLocalGovernmentIndexController extends Controller {
  filters = ['title', 'modifiedSince'];
  columns = [
    'title',
    'description',
    'modified',
    'classification',
    'organization',
  ];

  queryParams = ['page', 'size', 'sort', 'title', 'modifiedSince'];

  @tracked page = 0;
  @tracked size = 20;
  @tracked sort = 'title';
  @tracked title = '';
  @tracked modifiedSince = undefined;
  @service currentSession;

  get query() {
    return {
      page: this.page,
      size: this.size,
      sort: this.sort,
      title: this.title,
      modifiedSince: this.modifiedSince,
    };
  }

  @action
  updateQuery(query) {
    this.page = query.page;
    this.size = query.size;
    this.sort = query.sort;
    this.title = query.title;
    this.modifiedSince = query.modifiedSince;
  }
}
