import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessIcrCardAssetsMultipleSelectComponent extends Component {
  @service store;

  @restartableTask
  *loadInformationAssetsTask(searchParams = '') {
    const searchLabel = searchParams.trim();
    if (!searchLabel) return;

    yield timeout(500);

    const query = {
      filter: {
        label: searchLabel,
        ':exact:scheme': ENV.conceptSchemes.informationAssets,
      },
      sort: ':no-case:label',
    };

    let assets;
    try {
      const result = yield this.store.query('information-asset', query) ?? [];

      if (
        result.some((r) => r.label.toLowerCase() === searchLabel.toLowerCase())
      ) {
        assets = result;
      } else {
        assets = [{ label: searchLabel, isDraft: true }, ...result];
      }
    } catch {
      assets = [];
    }

    return assets;
  }
}
