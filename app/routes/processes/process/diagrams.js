import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class ProcessesProcessDiagramsRoute extends Route {
  @service diagram;
  @service store;
  @service session;

  beforeModel(transition) {
    if (!this.session.isAuthenticated) {
      this.session.requireAuthentication(transition, 'auth.login');
    }
  }
  async model() {
    const process = this.modelFor('processes.process');
    const processWithLists = await this.store.query('process', {
      'filter[id]': process.id,
      include:
        'diagram-lists,diagram-lists.diagrams,diagram-lists.diagrams.diagram-file',
    });
    const diagramLists = Array.from(processWithLists[0]?.diagramLists);
    const sortedOnCreatedDiagramsLists = diagramLists
      .filter((list) => list.diagrams.some((d) => !d.diagramFile.isArchived))
      .sort((a, b) => {
        return new Date(b.created) - new Date(a.created);
      });

    return {
      process: process,
      lists: sortedOnCreatedDiagramsLists,
      activeDiagramList: sortedOnCreatedDiagramsLists[0],
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);
    controller.selectedDiagramList = model.activeDiagramList;
    controller.selectedDiagramFile =
      model.activeDiagramList.diagrams[0]?.diagramFile;
  }
}
