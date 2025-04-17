import Model, { attr, hasMany } from '@ember-data/model';

export default class AdministrativeUnitClassificationCodeModel extends Model {
  @attr('string') label;
  @hasMany('process', { inverse: 'relevantAdministrativeUnits', async: false })
  processes;
}
