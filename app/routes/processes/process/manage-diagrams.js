import Route from '@ember/routing/route';

import { action } from '@ember/object';
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

    const [process, diagramList] = await Promise.all([
      this.store.findRecord('process', processId),
      this.diagram.getLatestDiagramList(processId),
    ]);
    const diagramListWithFiles =
      await this.diagram.fetchDiagramListWithDiagrams(diagramList?.id, true);
    return {
      process: process,
      diagramList: diagramList,
      files: this.diagram.getAvailableFilesFromList(diagramListWithFiles),
    };
  }

  @action
  async willTransition() {
    // eslint-disable-next-line ember/no-controller-access-in-routes
    const controller = this.controller;
    if (controller.isListChanged) {
      await controller.onResetStructure();
    }
  }
}
