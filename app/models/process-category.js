import Model, { attr } from '@ember-data/model';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessCategoryModel extends Model {
  @attr('string') label;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @attr('string', {
    defaultValue: ENV.conceptSchemes.processCategories,
  })
  scheme;

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }
}
