import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class ProcessSelectByGroupComponent extends Component {
  @service store;

  @restartableTask
  *loadGroupsTask(searchParams = '') {
    if (!searchParams?.trim()) return;

    yield timeout(200);

    let classificationIds;
    if (this.args.classifications) {
      // Handle if classifications is already an array of IDs
      if (Array.isArray(this.args.classifications)) {
        classificationIds = this.args.classifications;
      }
      // Handle if classifications is a comma-separated string (from URL)
      else if (typeof this.args.classifications === 'string') {
        classificationIds = this.args.classifications.split(',');
      }
      // Handle if classifications is a single classification object
      else if (this.args.classifications.id) {
        classificationIds = [this.args.classifications.id];
      }
    }

    // First query: get processes where publisher has these classifications
    const publisherProcessQuery = {
      'filter[:not:status]': ENV.resourceStates.archived,
      include: 'publisher,relevant-administrative-units',
    };

    if (classificationIds && classificationIds.length > 0) {
      publisherProcessQuery['filter[publisher][classification][:id:]'] =
        classificationIds.join(',');
    }

    // Second query: get processes where relevantAdministrativeUnits have these classifications
    const adminUnitProcessQuery = {
      'filter[:not:status]': ENV.resourceStates.archived,
      include: 'publisher,relevant-administrative-units',
    };

    if (classificationIds && classificationIds.length > 0) {
      adminUnitProcessQuery['filter[relevant-administrative-units][:id:]'] =
        classificationIds.join(',');
    }

    // Execute both queries
    const [publisherProcesses, adminUnitProcesses] = yield Promise.all([
      this.store.query('process', publisherProcessQuery),
      this.store.query('process', adminUnitProcessQuery),
    ]);

    // Combine the results and extract unique publisher IDs
    const groupIds = new Set();

    // Add publishers from processes with matching publisher classifications
    publisherProcesses.forEach((process) => {
      if (process.publisher) {
        groupIds.add(process.publisher.id);
      }
    });

    // Add publishers from processes with matching relevantAdministrativeUnits
    adminUnitProcesses.forEach((process) => {
      if (process.publisher) {
        groupIds.add(process.publisher.id);
      }
    });

    // If no groups found, return early
    if (groupIds.size === 0) return [];

    // Now query groups with these IDs
    const query = {
      page: {
        size: 50,
      },
      'filter[id]': Array.from(groupIds).join(','),
      sort: ':no-case:name',
    };

    // Add name search filter if provided
    if (searchParams) {
      query['filter[name]'] = searchParams;
    }

    const result = yield this.store.query('group', query);
    if (result) return [...new Set(result.map((r) => r.name))];
  }
}
