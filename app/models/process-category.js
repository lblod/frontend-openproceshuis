import ArchivableModel from './archivable';

import { attr } from '@ember-data/model';
import { service } from '@ember/service';

import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessCategoryModel extends ArchivableModel {
  @service store;

  @attr('string') label;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @attr('string', {
    defaultValue: ENV.conceptSchemes.processCategories,
  })
  scheme;

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  async canArchive() {
    if (this.isArchived) {
      return false;
    }

    const domains = await this.store.query('process-domain', {
      'filter[process-categories][id]': this.id,
      'filter[:exact:scheme]': ENV.conceptSchemes.processDomains,
    });

    return domains.length === 0;
  }
}
