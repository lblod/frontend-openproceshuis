import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';
import { task } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { VENDOR_CLASSIFICATION_ID } from '../utils/well-known-ids';
import { ARCHIVED_STATUS_URI } from '../utils/well-known-uris';

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
