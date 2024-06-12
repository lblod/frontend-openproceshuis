import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

export default class ProcessModel extends Model {
  @attr('string') title;
  @attr('string') description;
  @belongsTo('group', { inverse: null, async: false }) publisher;
  @hasMany('file', { inverse: 'process', async: false }) files;
}
