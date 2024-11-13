import Component from '@glimmer/component';
import { service } from '@ember/service';

export default class AppHeaderComponent extends Component {
  @service currentSession;
  @service session;
  @service impersonation;

  get userInfo() {
    let user;
    let group;

    if (this.impersonation.isImpersonating) {
      user = this.impersonation.originalAccount.user;
      group = this.impersonation.originalGroup;
    } else {
      user = this.currentSession.user;
      group = this.currentSession.group;
    }

    if (!user) {
      return '';
    }

    let userInfo = user.fullName;
    let groupInfo = '';

    if (group?.name) {
      groupInfo += ` ${group.name}`;
    }

    groupInfo.trim();

    if (groupInfo.length) {
      userInfo += ` - ${groupInfo}`;
    }

    return userInfo;
  }
}
