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
      const result = yield this.store.query('information-asset', query);

      let assetExists = false;
      assets = result.map((asset) => {
        if (asset.label.toLowerCase() === searchLabel.toLowerCase()) {
          assetExists = true;
          asset.isDraft = true;
          return asset;
        }
        return asset;
      });

      if (!assetExists)
        assets = [{ label: searchLabel, isDraft: true }, ...assets];
    } catch {
      assets = [];
    }

    return assets;
  }
}
