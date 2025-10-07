import ArchivableModel from './archivable';

import { attr, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessDomainModel extends ArchivableModel {
  @attr('string') label;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @attr('string', {
    defaultValue: ENV.conceptSchemes.processDomains,
  })
  scheme;

  @hasMany('process-category', { inverse: null, async: false })
  processCategories;

  get processCategory() {
    if (!this.processCategories || this.processCategories.length === 0)
      return null;
    return this.processCategories[0];
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  async canArchive() {
    if (this.isArchived) {
      return false;
    }

    const groups = await this.store.query('process-group', {
      'filter[process-domains][id]': this.id,
      'filter[:exact:scheme]': ENV.conceptSchemes.processGroups,
      'filter[:not:status]': ENV.resourceStates.archived,
    });

    return groups.length === 0;
  }

  async archive() {
    super.archive();
    this.status = ENV.resourceStates.archived;
    await this.save();
  }

  async unArchive() {
    super.unArchive();
    this.status = null;
    await this.save();
  }
}
