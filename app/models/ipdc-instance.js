import Model, { attr } from '@ember-data/model';

export default class IpdcInstanceModel extends Model {
  @attr('language-string-set') name;
  @attr('string') productNumber;
}
