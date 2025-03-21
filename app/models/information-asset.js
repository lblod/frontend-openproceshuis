import Model, { attr } from '@ember-data/model';

export default class InformationAssetModel extends Model {
  @attr('string') label;
  @attr('string') scheme;
}
