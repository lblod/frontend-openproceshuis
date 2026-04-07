import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';
import { task } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { ARCHIVED_STATUS_URI } from '../utils/well-known-uris';

const VENDOR_CLASSIFICATION_ID = 'c4483583-f9fe-4d2f-96f4-47ddb3440d71';

export default class ProcessSelectByVendor extends Component {
  @service store;

  @tracked vendors = A([]);

  loadVendors = task({ restartable: true }, async () => {
    const vendorGroups = await this.store.query('group', {
      'filter[classification][id]': VENDOR_CLASSIFICATION_ID,
      'filter[:has:processes]': true,
      'filter[processes][:not:status]': ARCHIVED_STATUS_URI,
    });

    this.vendors.clear();
    this.vendors.pushObjects([
      ...new Set(vendorGroups.map((group) => group.name)),
    ]);
  });
}
