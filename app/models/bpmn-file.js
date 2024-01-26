import { attr } from '@ember-data/model';
import ThingModel from './thing';

export default class BpmnFileModel extends ThingModel {
  @attr('string') format;
  @attr('number') size;
  @attr('string') extension;
  @attr('date') created;
  @attr('date') modified;
}
