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
    });
    this.vendors.clear();
    for (let index = 0; index < vendorGroups.length; index++) {
      const vendor = vendorGroups[index];
      const processesCreatedBy = await this.store.query('process', {
        'filter[creator][id]': vendor.id,
        'filter[:not:status]': ARCHIVED_STATUS_URI,
        page: {
          number: 0,
          size: 1,
        },
      });
      if (processesCreatedBy.length >= 1) {
        this.vendors.pushObject(vendor.name ?? 'NO-LABEL');
      }
    }
  });
}
