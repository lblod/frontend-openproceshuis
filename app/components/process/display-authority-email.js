import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

import { findPrimaryContact } from '../../models/contact-point';

export default class ProcessDisplayAuthorityEmail extends Component {
  @service store;

  fetchPublisher = restartableTask(async (publisherId) => {
    if (!publisherId) {
      return null;
    }

    return await this.store.findRecord('group', publisherId, {
      reload: true,
      include: 'primary-site,primary-site.contacts',
    });
  });

  publisher = trackedTask(this, this.fetchPublisher, () => [
    this.args.process?.publisher?.id,
  ]);

  get email() {
    return findPrimaryContact(this.publisher.value?.primarySite?.contacts)
      ?.email;
  }
}
