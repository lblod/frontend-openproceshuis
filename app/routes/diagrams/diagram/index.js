import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class DiagramsDiagramIndexRoute extends Route {
  @service session;
  @service store;

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model() {
    const { id } = await this.modelFor('diagrams.diagram');
    const diagram = await this.store.findRecord('diagram-list-item', id, {
      include: ['diagram-file', 'sub-items'].join(','),
      reload: true,
    });
    const processes = await this.store.query('process', {
      'filter[diagram-lists][diagrams][id]': diagram.id,
    });

    return {
      diagram: diagram,
      file: diagram.diagramFile,
      linkedProcesses: processes,
    };
  }
}
