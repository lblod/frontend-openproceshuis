import Model, { attr, hasMany } from '@ember-data/model';
import { BpmnElementTypes } from '../utils/bpmn-element-types';

export default class BpmnElementModel extends Model {
  @attr('string') name;
  @hasMany('process', { inverse: null, async: true }) processes;

  type = BpmnElementTypes.BpmnElement;
}
