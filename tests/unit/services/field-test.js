import { module, test } from 'qunit';
import { setupTest } from 'frontend-openproceshuis/tests/helpers';

import FieldService, {
  isAttachedField,
} from 'frontend-openproceshuis/services/field';

const FIELDS = [
  {
    key: 'title',
    context: 'processes',
    label: 'Titel',
    isFixed: true,
    order: 1,
  },
  {
    key: 'description',
    context: 'processes',
    label: 'Beschrijving',
    isFixed: true,
    tooltipFor: 'title',
    order: 2,
  },
  {
    key: 'blueprint',
    context: 'processes',
    label: 'Blauwdruk',
    iconFor: 'title',
    order: 3,
  },
  { key: 'created', context: 'processes', label: 'Aangemaakt op' },
  {
    key: 'organization',
    context: 'processes',
    label: 'Opgeladen door',
    order: 4,
  },
  { key: 'elsewhere', context: 'other-context', label: 'Elders', order: 1 },
];

class StubFieldService extends FieldService {
  get availableFields() {
    return FIELDS;
  }
}

module('AI generated | Unit | Service | field', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:field', StubFieldService);
    this.service = this.owner.lookup('service:field');
  });

  module('isAttachedField', function () {
    test('returns true for a field with tooltipFor or iconFor', function (assert) {
      assert.true(isAttachedField({ key: 'description', tooltipFor: 'title' }));
      assert.true(isAttachedField({ key: 'blueprint', iconFor: 'title' }));
    });

    test('returns false for a plain field', function (assert) {
      assert.false(isAttachedField({ key: 'title' }));
    });
  });

  module('availableFieldsFor', function () {
    test('returns only the fields of the given context', function (assert) {
      const keys = this.service
        .availableFieldsFor('processes')
        .map((f) => f.key);

      assert.deepEqual(keys, [
        'title',
        'description',
        'blueprint',
        'organization',
        'created',
      ]);
      assert.deepEqual(
        this.service.availableFieldsFor('other-context').map((f) => f.key),
        ['elsewhere'],
      );
      assert.deepEqual(this.service.availableFieldsFor('unknown'), []);
    });

    test('sorts by order and puts fields without an order last', function (assert) {
      const fields = this.service.availableFieldsFor('processes');

      assert.deepEqual(
        fields.map((f) => f.order),
        [1, 2, 3, 4, undefined],
      );
    });
  });

  module('fixedFieldsFor', function () {
    test('returns only the fields flagged isFixed', function (assert) {
      assert.deepEqual(
        this.service.fixedFieldsFor('processes').map((f) => f.key),
        ['title', 'description'],
      );
    });
  });

  module('dynamicFieldsFor', function () {
    test('excludes both fixed and attached fields', function (assert) {
      assert.deepEqual(
        this.service.dynamicFieldsFor('processes').map((f) => f.key),
        ['organization', 'created'],
      );
    });
  });
});
