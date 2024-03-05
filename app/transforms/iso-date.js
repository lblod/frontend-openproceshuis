import Transform from '@ember-data/serializer/transform';
import { isEmpty } from '@ember/utils';

export default class IsoDateTransform extends Transform {
  deserialize(serialized) {
    if (isEmpty(serialized)) return null;
    return new Date(serialized);
  }

  serialize(deserialized) {
    if (deserialized instanceof Date) return deserialized.toISOString();
    return null;
  }
}
