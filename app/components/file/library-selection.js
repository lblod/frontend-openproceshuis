import Component from '@glimmer/component';

import { A } from '@ember/array';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';

import { ARCHIVED_STATUS_URI } from '../../utils/well-known-uris';

export default class FileLibrarySelection extends Component {
  @service store;

  @tracked searchResults = A([]);

  searchFile = task({ restartable: true }, async (event) => {
    await timeout(250);
    const inputValue = event.target?.value?.trim();
    this.searchResults.clear();
    const results = await this.store.query('file', {
      'filter[name]': inputValue,
      'filter[:not:status]': ARCHIVED_STATUS_URI,
      sort: 'created',
      page: {
        number: 0,
        size: 5,
      },
    });

    this.searchResults.pushObjects(results);
  });
}
