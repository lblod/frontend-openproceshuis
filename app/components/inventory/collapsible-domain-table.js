import Component from '@glimmer/component';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryCollapsibleDomainTable extends Component {
  @service store;
  @service toaster;

  @tracked groups = A([]);
  @tracked isLoading = false;
  @tracked isFetchingGroups = false;
  @tracked isCollapsed = false;
  @tracked isCreatingGroup = false;

  constructor() {
    super(...arguments);
    this.isCollapsed = !!this.args.isCollapsedOnLoad;
    if (!this.isCollapsed) {
      this.loadGroups();
    }
  }

  @action
  async toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    if (!this.isCollapsed) {
      await this.loadGroups();
    }
  }

  @action
  async loadGroups() {
    this.isFetchingGroups = true;
    let loadingTimeout;
    new Promise((resolve) => {
      loadingTimeout = setTimeout(() => {
        this.isLoading = true;
        resolve();
      }, 50);
    });

    this.groups = await this.store.query('process-group', {
      'filter[process-domains][id]': this.args.domain.id,
      'filter[:exact:scheme]': ENV.conceptSchemes.processGroups,
      sort: 'label',
      page: { size: 100 },
    });
    clearTimeout(loadingTimeout);
    this.isLoading = false;
    this.isFetchingGroups = false;
  }

  @action
  async createGroup() {
    this.isCreatingGroup = true;
    const datetimeNow = new Date();
    const group = await this.store.createRecord('process-group', {
      label: 'Nieuwe groep',
      created: datetimeNow,
      modified: datetimeNow,
      processDomains: [this.args.domain],
    });
    try {
      await group.save();
      this.toaster.success(
        'Nieuwe groep toegevoegd aan domein',
        this.args.domain.label,
        {
          timeOut: 5000,
        },
      );
      this.groups = [...this.groups, group];
      this.isCreatingGroup = false;
    } catch (error) {
      this.isCreatingGroup = false;
      this.toaster.error(
        `Er liep iets mis bij het toevoegen van een nieuwe aan het domein ${this.args.domain.label}.`,
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
  }
}
