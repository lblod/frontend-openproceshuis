import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessIcrCardAssetsMultipleSelectComponent extends Component {
  @service store;

  @restartableTask
  *loadInformationAssetsTask(searchParams = '') {
    const searchTitle = searchParams.trim();
    if (!searchTitle) return [];

    yield timeout(500);

    const query = {
      filter: {
        title: searchTitle,
      },
      'filter[:not:status]': ENV.resourceStates.archived,
      sort: ':no-case:title',
    };

    let assets = [];
    try {
      assets = [...(yield this.store.query('information-asset', query))];
    } catch {
      return [];
    }

    const normalized = (v) => v.toLowerCase();
    const assetMap = new Map();

    for (const asset of assets) {
      const key = asset.id ?? normalized(asset.title);
      assetMap.set(key, asset);
    }

    this.args.selected?.forEach((selectedAsset) => {
      if (normalized(selectedAsset.title).startsWith(normalized(searchTitle))) {
        const key = selectedAsset.id ?? normalized(selectedAsset.title);
        assetMap.set(key, selectedAsset);
      }
    });

    let uniqueAssets = Array.from(assetMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    );

    const hasExactTitle = uniqueAssets.some(
      (a) => normalized(a.title) === normalized(searchTitle),
    );

    if (!hasExactTitle) {
      uniqueAssets = [{ title: searchTitle, isDraft: true }, ...uniqueAssets];
    }

    return uniqueAssets;
  }
}
