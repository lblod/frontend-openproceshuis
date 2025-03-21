import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';
import {
  sortedIndexOf,
  sortedIncludes,
  sortedInsert,
} from 'frontend-openproceshuis/utils/sorted-array-helpers';

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
      assets = [...(yield this.store.query('information-asset', query))];
    } catch {
      return [];
    }

    assets.forEach((asset) => (asset.isDraft = true));

    // Combine stored and selected assets (no duplicates + alphabetically sorted)
    this.args.selected?.forEach((selectedAsset) => {
      if (
        selectedAsset.label.toLowerCase().startsWith(searchLabel.toLowerCase())
      ) {
        const index = sortedIndexOf(assets, selectedAsset, 'label', true);

        if (index >= 0) {
          // In case select list contains stored asset --> overwrite stored asset
          assets[index] = selectedAsset;
        } else {
          // In case select list contains unstored asset --> add unstored asset
          assets = sortedInsert(assets, selectedAsset, 'label', true);
        }
      }
    });

    if (sortedIncludes(assets, searchLabel, 'label', true)) return assets;
    else return [{ label: searchLabel, isDraft: true }, ...assets];
  }
}
