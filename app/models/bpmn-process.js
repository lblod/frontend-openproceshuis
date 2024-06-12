import Model, { belongsTo } from '@ember-data/model';

export default class BpmnProcessModel extends Model {
  @belongsTo('file', { inverse: null, async: false }) derivation;
}
