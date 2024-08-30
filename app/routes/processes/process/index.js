import Route from '@ember/routing/route';

export default class ProcessesProcessIndexRoute extends Route {
  async model() {
    const { id: processId } = this.paramsFor('processes.process');

    const { loadProcessTaskInstance, loadedProcess } =
      this.modelFor('processes.process');

    return {
      processId,
      loadProcessTaskInstance,
      loadedProcess,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.fetchLatestBpmnFile.perform();
  }

  resetController(controller) {
    super.resetController(...arguments);
    controller.reset();
  }
}
