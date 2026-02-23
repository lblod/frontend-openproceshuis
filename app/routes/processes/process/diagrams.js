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
  async model(_params, transition) {
    const parentRouteName = transition.to?.name?.replace('.diagrams', '');
    const { process } = this.modelFor(parentRouteName);
    const lists = await this.diagram.getDiagramListsWithFilesForProcess(
      process.id,
    );
    const sortedOnCreatedLists = lists.sort((a, b) => {
      return new Date(b.created) - new Date(a.created);
    });

    return {
      process: process,
      lists: sortedOnCreatedLists,
      activeDiagramList: sortedOnCreatedLists[0],
      breadcrumRouteName: parentRouteName,
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);
    controller.selectedDiagramList = model.activeDiagramList;
    controller.selectedDiagramFile = this.diagram.getFirstFileOfList(
      model.activeDiagramList,
    );
  }
}
