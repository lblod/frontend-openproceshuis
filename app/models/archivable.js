import Model, { attr } from '@ember-data/model';

export default class ArchivableModel extends Model {
  @attr('datetime') archivedAt;

  async canArchive() {
    return false;
  }

  async archive() {
    this.archivedAt = new Date();
  }

  async unArchive() {
    this.archivedAt = null;
  }
}
