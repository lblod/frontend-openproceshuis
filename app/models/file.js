import Model, { attr, belongsTo } from '@ember-data/model';

import ENV from 'frontend-openproceshuis/config/environment';

export default class FileModel extends Model {
  @attr('string') name;
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('string') version;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;

  @belongsTo('information-asset', { inverse: 'attachments', async: false })
  informationAsset;

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  archive() {
    this.status = ENV.resourceStates.archived;
  }

  get isBpmnFile() {
    return this.extension === 'bpmn';
  }

  get isVisioFile() {
    return this.extension === 'vsdx';
  }
}
