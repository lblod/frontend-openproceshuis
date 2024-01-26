import ThingModel from './thing';
import { hasMany } from '@ember-data/model';

export default class ProcessModel extends ThingModel {
  @hasMany('bpmn-file', { inverse: null, async: true }) derivations;
}
