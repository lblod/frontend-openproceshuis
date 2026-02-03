import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class FileModel extends Model {
  @attr('string') name;
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;

  @hasMany('process', { inverse: 'files', async: false }) processes;
  @belongsTo('information-asset', { inverse: 'attachments', async: false })
  informationAsset;

  get process() {
    if (!this.processes || this.processes.length === 0) return null;
    return this.processes[0];
  }

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
