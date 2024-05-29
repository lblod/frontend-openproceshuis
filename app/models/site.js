import Model, { hasMany, belongsTo } from '@ember-data/model';
export default class SiteModel extends Model {
  @hasMany('contact-point', {
    inverse: null,
    async: false,
  })
  contacts;
  @belongsTo('site-type', {
    inverse: null,
    async: false,
  })
  siteType;
}
