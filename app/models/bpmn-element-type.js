import Model, { attr } from '@ember-data/model';

export default class BpmnElementTypeModel extends Model {
  @attr('language-string') label;
  @attr('language-string') key;

  get name() {
    return this.label?.content;
  }

  get queryValue() {
    return this.key?.content;
  }
}
