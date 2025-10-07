import ArchivableModel from './archivable';

import { attr, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessGroupModel extends ArchivableModel {
  @attr('string') label;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @attr('string', {
    defaultValue: ENV.conceptSchemes.processGroups,
  })
  scheme;

  @hasMany('process-domain', { inverse: null, async: false })
  processDomains;

  get processDomain() {
    if (!this.processDomains || this.processDomains.length === 0) return null;
    return this.processDomains[0];
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  async canArchive() {
    return true;
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
