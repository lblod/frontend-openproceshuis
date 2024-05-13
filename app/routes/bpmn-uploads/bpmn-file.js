import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { keepLatestTask } from 'ember-concurrency';

export default class BpmnUploadsBpmnFileRoute extends Route {
  @service router;
  @service session;
  @service currentSession;
  @service store;

  async beforeModel(transition) {
    this.session.requireAuthentication(transition, 'mock-login');

    if (this.currentSession.canOnlyRead)
      this.router.transitionTo('unauthorized');
  }

  async model() {
    let { id: fileId } = this.paramsFor('bpmn-uploads.bpmn-file');

    return {
      loadMetadataTaskInstance: this.loadBpmnFileTask.perform(fileId),
      loadedMetadata: this.loadBpmnFileTask.lastSuccesful?.value,
    };
  }

  @keepLatestTask({ cancelOn: 'deactivate' })
  *loadBpmnFileTask(fileId) {
    return yield this.store.findRecord('file', fileId, {
      include: 'publisher',
    });
  }
}
