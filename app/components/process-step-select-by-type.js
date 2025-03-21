import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessStepSelectByTypeComponent extends Component {
  @service router;
  @service store;

  @tracked types = [];

  @restartableTask
  *loadProcessStepTypesTask() {
    const query = {
      page: {
        number: 0,
        size: 45,
      },
      sort: ':no-case:label',
      'filter[:exact:scheme]': ENV.conceptSchemes.bpmnElementTypes,
    };

    const result = yield this.store.query('bpmn-element-type', query);
    this.types = result;

    const selectedTypeQueryValue = this.router.currentRoute.queryParams.type;
    if (selectedTypeQueryValue) {
      const selectedType = this.types.find(
        (type) => type.queryValue === selectedTypeQueryValue
      );
      this.args.onChange(selectedType);
    }
  }
}
