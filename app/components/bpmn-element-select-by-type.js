import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class BpmnElementSelectByTypeComponent extends Component {
  @service store;

  @tracked types = [];
  @tracked type = null;

  @action
  setType(selected) {
    this.type = selected;
    this.args.onChange(selected?.queryValue ?? '');
  }

  @restartableTask
  *loadBpmnElementTypesTask() {
    const result = yield this.store.query('bpmn-element-type', {
      sort: ':no-case:label',
    });
    this.types = result;

    console.log('selected type:', this.args.selected);

    if (this.args.selected) {
      this.type = result.find((type) => type.queryValue === this.args.selected);
    }
  }
}
