import Model, { attr } from '@ember-data/model';

export default class BpmnElementTypeModel extends Model {
  @attr('language-string-set') label;
  @attr('language-string') key;

  get labelNl() {
    if (!this.label?.length) return null;
    return (
      this.label.find((label) => label.language === 'nl')?.content ??
      this.label.find((label) => label.language.startsWith('nl'))?.content ??
      this.label[0].content
    );
  }

  get queryValue() {
    return this.key?.content;
  }
}
