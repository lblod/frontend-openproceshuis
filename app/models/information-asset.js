import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InformationAssetModel extends Model {
  @attr('string') title;
  @attr('string') description;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @attr('number', { defaultValue: 0 }) confidentialityScore;
  @attr('number', { defaultValue: 0 }) integrityScore;
  @attr('number', { defaultValue: 0 }) availabilityScore;

  @attr('boolean', { defaultValue: false }) containsPersonalData;
  @attr('boolean', { defaultValue: false }) containsProfessionalData;
  @attr('boolean', { defaultValue: false }) containsSensitivePersonalData;
  @belongsTo('information-asset', { inverse: null, async: false })
  previousVersion;

  @hasMany('information-asset', { inverse: 'nextVersions', async: true })
  previousVersions;

  @hasMany('information-asset', { inverse: 'previousVersions', async: true })
  nextVersions;

  @belongsTo('group', { inverse: null, async: false }) creator;
  @hasMany('processes', { inverse: null, async: false })
  processes;

  archive() {
    this.status = ENV.resourceStates.archived;
  }

  isArchived() {
    return this.status === ENV.resourceStates.archived;
  }
}
