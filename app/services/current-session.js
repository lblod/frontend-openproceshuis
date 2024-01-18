import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class CurrentSessionService extends Service {
  @tracked user;
  @tracked title;

  load() {
    this.user = { fullName: 'Demogebruiker' };
    this.title = `${this.user.fullName} - Demo`;
  }
}
