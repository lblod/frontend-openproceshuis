import Model from '@ember-data/model';

export default class ArchivableModel extends Model {
  async canArchive() {
    return false;
  }
}
