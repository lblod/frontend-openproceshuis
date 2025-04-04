import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import ENV from 'frontend-openproceshuis/config/environment';

const EDITOR_ROLES = [
  'LoketLB-OpenProcesHuisGebruiker',
  'LoketLB-OpenProcesHuisAfnemer',
];
const ADMIN_ROLE = 'LoketLB-admin';
const ABB_DV_IDENTIFIERS = [ENV.ovoCodes.abb, ENV.ovoCodes.dv];

export default class CurrentSessionService extends Service {
  @service session;
  @service store;
  @service impersonation;

  @tracked account;
  @tracked user;
  @tracked title;
  @tracked group;
  @tracked roles;

  async load() {
    if (this.session.isAuthenticated) {
      await this.impersonation.load();

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

  get isAuthenticated() {
    return this.session.isAuthenticated;
  }

  get hasEditorRole() {
    return this.roles.some((role) => EDITOR_ROLES.includes(role));
  }

  get isAbbOrDv() {
    return ABB_DV_IDENTIFIERS.includes(this.group?.identifier);
  }

  get canEdit() {
    return this.isAuthenticated && this.hasEditorRole;
  }

  get readOnly() {
    return this.isAuthenticated && !this.isAdmin && !this.hasEditorRole;
  }

  get isAdmin() {
    let roles = this.roles;
    if (this.impersonation.isImpersonating)
      roles = this.impersonation.originalRoles || [];
    return roles?.includes(ADMIN_ROLE);
  }
}
