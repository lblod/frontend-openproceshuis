import Model, { attr, belongsTo } from '@ember-data/model';

export default class JobModel extends Model {
  @attr('string') status;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') resource;
  @attr('string') operation;
  @belongsTo('group', { inverse: null, async: false }) creator;
}
