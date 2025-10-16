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
    group: { refreshModel: true },
    processTitle: { refreshModel: true },
    processNumber: { refreshModel: true },
  };

  async model(params) {
    // eslint-disable-next-line ember/no-controller-access-in-routes
    const controller = this.controllerFor('inventory.index');
    controller.isLoadingRoute = true;
    let modifiedParams = { ...params };
    if (!params.size) {
      modifiedParams['size'] = 20;
    }
    try {
      const tableContent =
        await this.processApi.fetchInventoryProcessesTableContent(
          modifiedParams,
        );
      return {
        tableContent: tableContent,
        couldNotFetchTableContent: false,
        params: modifiedParams,
      };
    } catch (error) {
      return {
        tableContent: null,
        couldNotFetchTableContent: true,
        params: modifiedParams,
      };
    } finally {
      controller.isLoadingRoute = false;
    }
  }
}
