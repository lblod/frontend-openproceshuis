import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { modelValidator } from 'ember-model-validator';
import ENV from 'frontend-openproceshuis/config/environment';
import {
  isOnlyWhitespace,
  isEmptyOrEmail,
} from 'frontend-openproceshuis/utils/custom-validators';

@modelValidator
export default class ProcessModel extends Model {
  @attr('string') title;
  @attr('string') description;
  @attr('string') email;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @belongsTo('group', { inverse: null, async: false }) publisher;
  @hasMany('file', { inverse: 'processes', async: false }) files;
  @hasMany('ipdc-instance', { inverse: null, async: false }) ipdcInstances;

  validations = {
    title: {
      presence: true,
      length: {
        maximum: 100,
      },
    },
    description: {
      length: {
        maximum: 3000,
      },
      custom: (_, value) => !isOnlyWhitespace(value),
    },
    email: {
      custom: (_, value) => isEmptyOrEmail(value),
    },
  };

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  archive() {
    this.status = ENV.resourceStates.archived;
  }

  get bpmnFile() {
    const bpmnFiles = this.files.filter(
      (file) => file.isBpmnFile && file.status !== ENV.resourceStates.archived
    );
    if (bpmnFiles.length === 0) return undefined;

    const bpmnFilesSorted = bpmnFiles.sort(
      (fileA, fileB) => fileB.created - fileA.created
    );
    return bpmnFilesSorted[0];
  }

  get ipdcInstance() {
    if (this.ipdcInstances.length === 0) return undefined;
    return this.ipdcInstances[0];
  }

  set ipdcInstance(ipdcInstance) {
    this.ipdcInstances = [ipdcInstance];
  }
}
