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

  @belongsTo('group', { inverse: null, async: false })
  creator;

  @hasMany('process', {
    inverse: 'informationAssets',
    async: false,
    polymorphic: true,
    as: 'information-asset',
  })
  processes;
  @hasMany('file', { inverse: 'informationAssets', async: false })
  attachments;
  @hasMany('link', { inverse: null, async: false })
  links;
  @hasMany('versioned-information-asset', {
    inverse: 'canonical',
    async: false,
    polymorphic: true,
  })
  versions;

  archive() {
    this.status = ENV.resourceStates.archived;
  }

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  get isVersionedInformationAsset() {
    return false;
  }

  get versionData() {
    return {
      title: this.title,
      description: this.description,
      confidentialityScore: this.confidentialityScore,
      integrityScore: this.integrityScore,
      availabilityScore: this.availabilityScore,
      containsPersonalData: this.containsPersonalData,
      containsProfessionalData: this.containsProfessionalData,
      containsSensitivePersonalData: this.containsSensitivePersonalData,
    };
  }
}
