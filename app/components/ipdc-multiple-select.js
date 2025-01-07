import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';

export default class OrganizationTypeMultipleSelectComponent extends Component {
  @service store;

  @restartableTask
  *loadIpdcInstancesTask(searchParams = '') {
    if (!searchParams) return;

    yield timeout(500);

    const ipdc1 = this.store.createRecord('ipdc-instance');
    ipdc1.name = 'ipdc1';
    ipdc1.productNumber = '1';

    const ipdc2 = this.store.createRecord('ipdc-instance');
    ipdc2.name = 'ipdc2';
    ipdc2.productNumber = '2';

    const ipdc3 = this.store.createRecord('ipdc-instance');
    ipdc3.name = 'ipdc3';
    ipdc3.productNumber = '3';

    return [ipdc1, ipdc2, ipdc3];
  }
}
