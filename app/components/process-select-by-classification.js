import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class ProcessSelectByClassificationComponent extends Component {
  @service router;
  @service store;

  @tracked classifications = [];

  @restartableTask
  *loadProcessClassificationsTask() {
    const query = {
      page: {
        number: 0,
        size: 20,
      },
      'filter[:has:groups]': true,
      'filter[groups][:has:processes]': true,
      sort: ':no-case:label',
    };

    const result = yield this.store.query(
      'administrative-unit-classification-code',
      query,
    );
    this.classifications = result;

    const selectedClassificationLabel =
      this.router.currentRoute.queryParams.classification;
    if (selectedClassificationLabel) {
      const selectedClassification = this.classifications.find(
        (classification) =>
          classification.label === selectedClassificationLabel,
      );
      this.args.onChange(selectedClassification);
    }
  }
}
