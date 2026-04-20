import Service from '@ember/service';
import { service } from '@ember/service';

export default class VersionedStoreService extends Service {
  @service store;
  @service currentSession;

  isModelNameSupported(modelName) {
    const models = ['information-asset', 'process'];

    return models.includes(modelName);
  }

  createRecord(modelName, data) {
    if (!this.isModelNameSupported(modelName)) {
      throw new Error(`Unsupported versioned model: ${modelName}`);
    }

    const createdAt = new Date();
    const fullData = {
      ...data,
      created: createdAt,
      modified: createdAt,
      // creator: this.currentSession.group,
    };

    const canonicalRecord = this.store.createRecord(modelName, fullData);
    const versionedRecord = this.store.createRecord(`versioned-${modelName}`, {
      ...fullData,
      canonical: canonicalRecord,
    });

    return { canonicalRecord, versionedRecord };
  }

  async updateRecord(modelName, oldVersionedRecord) {
    if (!this.isModelNameSupported(modelName)) {
      throw new Error(`Unsupported versioned model: ${modelName}`);
    }

    const canonicalRecord = await oldVersionedRecord.canonical;

    if (!canonicalRecord?.hasDirtyAttributes) {
      return { canonicalRecord, oldVersionedRecord };
    }

    const createdAt = new Date();
    const versionData = canonicalRecord.versionData;

    const newVersionedRecord = this.store.createRecord(
      `versioned-${modelName}`,
      {
        ...versionData,
        created: createdAt,
        modified: createdAt,
        // creator: this.currentSession.group,
        canonical: canonicalRecord,
        previousVersion: oldVersionedRecord,
      },
    );

    oldVersionedRecord.archive();
    oldVersionedRecord.modified = createdAt;

    return {
      canonicalRecord,
      oldVersionedRecord,
      newVersionedRecord,
    };
  }
}
