import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ProcessStepSelectByTypeComponent extends Component {
  @service store;

  @tracked types = [];
  @tracked type = null;

  @action
  setType(selected) {
    this.type = selected;
    this.args.onChange(selected?.queryValue ?? '');
  }

  @restartableTask
  *loadProcessStepTypesTask() {
    const query = {
      page: {
        number: 0,
        size: 45,
      },
      sort: ':no-case:label',
      'filter[scheme]':
        'http://lblod.data.gift/concept-schemes/d4259f0b-6d6e-4a46-b9e1-114b774e0f1e',
    };

    const result = yield this.store.query('bpmn-element-type', query);
    this.types = result;

    if (this.args.selected) {
      this.type = result.find((type) => type.queryValue === this.args.selected);
    }
  }
}
