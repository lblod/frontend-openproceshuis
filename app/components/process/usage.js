import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';

import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class ProcessUsage extends Component {
  @service processApi;

  @tracked organizations = A([]);

  fetchUsage = restartableTask(async () => {
    const usage = await this.processApi.getOrganizationalProcessUsage(
      this.args.process.id,
    );
    this.organizations.clear();
    this.organizations.pushObjects(usage);

    return usage;
  });

  usages = trackedTask(this, this.fetchUsage);
}
