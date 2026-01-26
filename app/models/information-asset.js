import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class InformationAssetModel extends Model {
  @attr('string') title;
  @attr('string') description;
  @attr('iso-date') created;
  @attr('string') status;
  @attr('number') confidentialityScore;
  @attr('number') integrityScore;
  @attr('number') availabilityScore;
  @attr('boolean') containsPersonalData;
  @attr('boolean') containsProfessionalData;
  @attr('boolean') containsSensitivePersonalData;
  @belongsTo('informationAsset', { inverse: null, async: false })
  previousVersion;
  @belongsTo('group', { inverse: null, async: false }) creator;
  @hasMany('processes', { inverse: null, async: false })
  processes;
}
