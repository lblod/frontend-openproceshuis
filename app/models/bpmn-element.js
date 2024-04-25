import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class BpmnElementModel extends Model {
  @attr('string') name;
  @belongsTo('bpmn-element-type', { inverse: null, async: false }) type;
  @hasMany('process', { inverse: null, async: false }) processes;

  get process() {
    return this.processes[0];
  }
}
