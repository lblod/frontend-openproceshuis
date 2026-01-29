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
    const diagramLists = processWithLists[0]?.diagramLists;

    return {
      lists: diagramLists,
    };
  }
}
