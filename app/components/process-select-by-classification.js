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
    const baseQuery = {
      page: { number: 0, size: 100 },
      sort: ':no-case:label',
    };

    const publisherGroupQuery = {
      ...baseQuery,
      'filter[groups][:has:processes]': true,
    };

    const relevantUnitQuery = {
      ...baseQuery,
      'filter[:has:processes]': true,
    };

    const [fromPublisherGroups, fromRelevantUnits] = yield Promise.all([
      this.store.query(
        'administrative-unit-classification-code',
        publisherGroupQuery
      ),
      this.store.query(
        'administrative-unit-classification-code',
        relevantUnitQuery
      ),
    ]);

    const merged = [
      ...fromPublisherGroups.toArray(),
      ...fromRelevantUnits.toArray(),
    ];

    const uniqueById = Array.from(
      new Map(merged.map((item) => [item.id, item])).values()
    );

    this.classifications = uniqueById;
  }
}
