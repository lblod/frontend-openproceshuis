import Service from '@ember/service';
import { service } from '@ember/service';

export default class VersionedStoreService extends Service {
  @service store;

  createRecord(modelName, data) {
    if (modelName !== 'information-asset') {
      throw new Error(`Unsupported versioned model: ${modelName}`);
    }

    const createdAt = new Date();
    const fullData = {
      ...data,
      created: createdAt,
      modified: createdAt,
    };

    const canonicalRecord = this.store.createRecord(modelName, fullData);
    const versionedRecord = this.store.createRecord(`versioned-${modelName}`, {
      ...fullData,
      canonical: canonicalRecord,
    });

    return { canonicalRecord, versionedRecord };
  }
}
