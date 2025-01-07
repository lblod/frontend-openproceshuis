import Model, { attr } from '@ember-data/model';

export default class IpdcInstanceModel extends Model {
  @attr('language-string-set') name;
  @attr('string') productNumber;

  get nameNl() {
    if (!this.name?.length) return undefined;

    return (
      this.name.find((name) => name.language === 'nl')?.content ??
      this.name.find((name) => name.language.startsWith('nl'))?.content ??
      this.name[0].content
    );
  }
}
