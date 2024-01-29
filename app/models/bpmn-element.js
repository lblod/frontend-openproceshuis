import Model, { attr, hasMany } from '@ember-data/model';

export default class BpmnElementModel extends Model {
  @attr('string') name;
  @hasMany('process', { inverse: null, async: true }) processes;
}
