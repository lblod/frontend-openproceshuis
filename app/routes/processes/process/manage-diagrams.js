import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class ProcessesProcessManageDiagramsRoute extends Route {
  @service session;
  @service store;
  @service diagram;

  queryParams = [
    { previousRouteTitle: { refreshModel: false } },
    { previousRouteModelId: { refreshModel: false } },
    { previousRouteName: { refreshModel: false } },
  ];

  beforeModel(transition) {
    if (!this.session.isAuthenticated) {
      this.session.requireAuthentication(transition, 'auth.login');
    }
  }

  async model(params, transition) {
    const parentRouteName = transition.to?.name?.replace(
      '.manage-diagrams',
      '',
    );
    let processId = params.id;
    if (!processId) {
      const { process } = this.modelFor(parentRouteName);
      processId = process?.id;
    }

    const process = await this.store.findRecord('process', processId);
    const diagramList = await this.diagram.getLatestDiagramList(processId);

    return {
      process: process,
      diagramList: diagramList,
    };
  }
}
