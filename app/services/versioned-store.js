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

  async updateRecord(modelName, oldVersionedRecord) {
    if (modelName !== 'information-asset') {
      throw new Error(`Unsupported versioned model: ${modelName}`);
    }

    const canonicalRecord = await oldVersionedRecord.canonical;

    if (!canonicalRecord?.hasDirtyAttributes) {
      return { canonicalRecord, oldVersionedRecord };
    }

    const createdAt = new Date();

    const versionData = this.buildVersionData(canonicalRecord);

    const newVersionedRecord = this.store.createRecord(
      `versioned-${modelName}`,
      {
        ...versionData,
        created: createdAt,
        modified: createdAt,
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

  buildVersionData(record) {
    const data = {};
    const modelClass = record.constructor;

    modelClass.eachAttribute((name) => {
      data[name] = record[name];
    });

    modelClass.eachRelationship((name, descriptor) => {
      if (name === 'versions') {
        return;
      }

      if (descriptor.kind === 'belongsTo') {
        data[name] = record[name];
        return;
      }

      data[name] = record[name]?.slice() ?? [];
    });

    return data;
  }
}
