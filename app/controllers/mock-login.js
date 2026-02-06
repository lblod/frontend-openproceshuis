import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { action } from '@ember/object';

export default class MockLoginController extends Controller {
  @service store;
  @service currentSession;
  @service session;

  queryParams = ['gemeente', 'page'];
  size = 10;

  @tracked model;
  @tracked gemeente = '';
  @tracked page = 0;

  queryStore = task(async () => {
    const filter = { provider: 'https://github.com/lblod/mock-login-service' };
    if (this.gemeente) {
      filter.user = {
        'family-name': this.gemeente,
      };
    }
    const accounts = await this.store.query('account', {
      include: 'user,user.groups',
      filter: filter,
      page: { size: this.size, number: this.page },
      sort: 'user.first-name',
    });
    return accounts;
  });

  @action
  async login(account) {
    // TODO: Error handling
    const user = await account.user;
    const group = (await user.groups)[0];
    const groupId = (await group).id;
    // TODO: Make new version of mock-login
    await this.session.authenticate(
      'authenticator:mock-login',
      account.id,
      groupId,
    );
  }

  updateSearch = task({ restartable: true }, async (value) => {
    await timeout(500); // Debounce
    this.page = 0;
    this.gemeente = value;

    this.model = await this.queryStore.perform();
  });
}
