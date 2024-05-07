import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

const EDITOR_ROLES = ['LoketLB-ContactOrganisatiegegevensGebruiker'];

export default class CurrentSessionService extends Service {
  @service session;
  @service store;

  @tracked account;
  @tracked user;
  @tracked title;
  @tracked group;
  @tracked roles;

  async load() {
    if (this.session.isAuthenticated) {
      let sessionData = this.session.data.authenticated.relationships;
      this.roles = [
        ...new Set(this.session.data.authenticated.data?.attributes?.roles),
      ];

      let accountId = sessionData.account.data.id;
      this.account = await this.store.findRecord('account', accountId, {
        include: 'user',
      });
      this.user = this.account.user;

      let groupId = sessionData?.group?.data?.id;
      this.group = await this.store.findRecord('group', groupId);

      this.title = `${this.user.firstName} ${this.user.familyName} - ${this.group.name}`;
    }
  }

  get canEdit() {
    if (!this.session.isAuthenticated) return false;
    return this.roles.some((role) => EDITOR_ROLES.includes(role));
  }

  get canOnlyRead() {
    return !this.canEdit;
  }
}
