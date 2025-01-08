import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ProcessSelectByClassificationComponent extends Component {
  @service store;

  @tracked classifications = [];
  @tracked classification = null;

  @action
  setClassification(selected) {
    this.classification = selected;
    this.args.onChange(selected?.label ?? '');
  }

  @restartableTask
  *loadProcessClassificationsTask() {
    const query = {
      page: {
        number: 0,
        size: 20,
      },
      sort: ':no-case:label',
    };

    const result = yield this.store.query(
      'administrative-unit-classification-code',
      query
    );
    this.classifications = result;

    if (this.args.selected) {
      this.classification = result.find(
        (classification) => classification.label === this.args.selected
      );
    }
  }
}
