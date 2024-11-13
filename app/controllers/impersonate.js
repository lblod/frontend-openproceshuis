import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { restartableTask, task, timeout } from 'ember-concurrency';

export default class ImpersonateController extends Controller {
  @service impersonation;
  @service router;
  @service store;

  queryParams = ['gemeente', 'page'];
  size = 10;

  @tracked model;
  @tracked gemeente = '';
  @tracked page = 0;

  setup() {
    this.queryStore.perform();
  }

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

    this.model = accounts;
  });

  updateSearch = restartableTask(async (event) => {
    await timeout(500);
    this.page = 0;
    this.gemeente = event.target.value;

    await this.queryStore.perform();
  });

  impersonateAccount = task(async (accountId) => {
    await this.impersonation.impersonate(accountId);
    await this.router.transitionTo('index');

    window.location.reload();
  });
}
