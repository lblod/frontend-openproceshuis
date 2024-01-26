import ThingModel from './thing';
import { hasMany } from '@ember-data/model';

export default class TaskModel extends ThingModel {
  @hasMany('process', { inverse: null, async: true }) processes;
}
