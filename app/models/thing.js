import Model, { attr } from '@ember-data/model';

export default class ThingModel extends Model {
  @attr('string') name;
}
