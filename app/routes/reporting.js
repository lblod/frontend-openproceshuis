import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';

export default class ReportingRoute extends Route {
  @service store;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    return {
      loadReportsTaskInstance: this.loadReportsTask.perform(params),
      loadedReports: this.loadReportsTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadReportsTask(params) {
    let query = {
      page: {
        number: params.page,
        size: params.size,
      },
      include: 'file',
    };

    if (params.sort) {
      const isDescending = params.sort.startsWith('-');

      const fieldName = isDescending ? params.sort.substring(1) : params.sort;

      let sortValue = `:no-case:${fieldName}`;
      if (isDescending) sortValue = `-${sortValue}`;

      query.sort = sortValue;
    }

    return yield this.store.query('report', query);
  }
}
