import Component from '@glimmer/component';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryLabelWithStatusPill extends Component {
  get status() {
    const statusUriMap = [
      {
        uri: ENV.resourceStates.archived,
        label: 'Gearchiveerd',
        skin: 'warning',
      },
      {
        uri: null,
        label: 'Actief',
        skin: 'success',
      },
    ];

    return statusUriMap.find(
      (s) => s.uri === this.args.statusUri || s.uri === null,
    );
  }
}
