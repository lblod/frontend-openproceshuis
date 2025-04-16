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
      query
    );
    this.classifications = result;

    const classificationsParam =
      this.router.currentRoute.queryParams.classifications;
    if (classificationsParam) {
      const classificationLabels = classificationsParam.split(',');
      const selectedClassifications = this.classifications.filter(
        (classification) => classificationLabels.includes(classification.label)
      );
      if (selectedClassifications.length > 0) {
        this.args.onChange(selectedClassifications);
      }
    }
  }
}
