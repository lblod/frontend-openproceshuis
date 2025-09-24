import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class InventoryIndexRoute extends Route {
  @service session;
  @service store;
  @service processApi;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    category: { refreshModel: true },
    domain: { refreshModel: true },
  };

  async model(params) {
    try {
      const tableContent =
        await this.processApi.fetchInventoryProcessesTableContent(params);
      return {
        tableContent: tableContent,
        couldNotFetchTableContent: false,
        params,
      };
    } catch (error) {
      return {
        tableContent: null,
        couldNotFetchTableContent: true,
        params,
      };
    }
  }
}
