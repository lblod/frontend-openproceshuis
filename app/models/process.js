import BpmnElementModel from './bpmn-element';
import { hasMany } from '@ember-data/model';

export default class ProcessModel extends BpmnElementModel {
  @hasMany('bpmn-file', { inverse: null, async: true }) derivations;
}
