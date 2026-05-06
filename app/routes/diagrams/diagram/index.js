import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class DiagramsDiagramIndexRoute extends Route {
  @service session;
  @service store;
  @service router;

  queryParams = [
    { previousRouteTitle: { refreshModel: false } },
    { previousRouteModelId: { refreshModel: false } },
    { previousRouteName: { refreshModel: false } },
  ];

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model() {
    const { id } = await this.modelFor('diagrams.diagram');
    const diagram = await this.store.findRecord('diagram-list-item', id, {
      include: ['diagram-file', 'sub-items'].join(','),
      reload: true,
    });

    if (diagram.isArchived || diagram.diagramFile?.isArchived) {
      this.router.replaceWith('not-found');
    }

    const processes = await this.store.query('process', {
      'filter[diagram-lists][diagrams][id]': diagram.id,
      reload: true,
    });

    return {
      diagram: diagram,
      file: diagram.diagramFile,
      linkedProcesses: processes,
    };
  }
}
