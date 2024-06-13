import Model, { attr, belongsTo } from '@ember-data/model';

export default class BpmnElementModel extends Model {
  @attr('string') name;
  @belongsTo('bpmn-element-type', { inverse: null, async: false }) type;
  @belongsTo('bpmn-process', { inverse: null, async: false }) bpmnProcess;
}
