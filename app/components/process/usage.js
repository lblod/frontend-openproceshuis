import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';

import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class ProcessUsage extends Component {
  @service store;

  @tracked organizations = A([]);

  fetchUsage = restartableTask(async () => {
    const processMatches = await this.store.query('process', {
      'filter[id]': this.args.process?.id,
      include: ['users', 'users.classification'].join(','),
      page: { size: 1 },
    });
    this.organizations.clear();

    processMatches[0]?.users.map((organization) => {
      const label = organization.name;
      const type = organization.classification?.label;
      this.organizations.pushObject({
        label,
        type,
      });
    });
  });

  usages = trackedTask(this, this.fetchUsage, () => [
    this.args.refreshDataTrigger,
  ]);
}
