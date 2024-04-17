import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class BpmnElementSelectByTypeComponent extends Component {
  @service store;

  @tracked types = [];

  constructor() {
    super(...arguments);
    this.loadBpmnElementTypesTask.perform();
  }

  @restartableTask *loadBpmnElementTypesTask() {
    this.types = yield this.store.findAll('bpmn-element-type');
  }
}
