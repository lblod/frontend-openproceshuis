import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class InventoryIndexRoute extends Route {
  @service session;
  @service store;
  @service processApi;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    try {
      const tableContent =
        await this.processApi.fetchInventoryProcessesTableContent({
          page: params.page,
          size: params.size,
          sort: params.sort,
        });
      return {
        tableContent: tableContent,
        couldNotFetchTableContent: false,
      };
    } catch (error) {
      return {
        tableContent: null,
        couldNotFetchTableContent: true,
      };
    }
  }
}
