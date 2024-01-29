import Model, { hasMany } from '@ember-data/model';

export default class ProcessModel extends Model {
  @hasMany('bpmn-file', { inverse: null, async: true }) derivations;
}
