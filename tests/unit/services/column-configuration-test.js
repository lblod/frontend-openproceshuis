import { module, test } from 'qunit';
import { setupTest } from 'frontend-openproceshuis/tests/helpers';

const CONTEXT = 'test-context';
const STORAGE_KEY = `COLUMN_CONFIGURATION_${CONTEXT}`;

const FIELDS = [
  { key: 'title', label: 'Titel', isFixed: true, isDefault: true },
  {
    key: 'description',
    label: 'Beschrijving',
    isFixed: true,
    isDefault: true,
    tooltipFor: 'title',
  },
  { key: 'blueprint', label: 'Blauwdruk', iconFor: 'title' },
  { key: 'organization', label: 'Opgeladen door', isDefault: true },
  { key: 'created', label: 'Aangemaakt op' },
];

function keysOf(columns) {
  return columns.map((column) => column.key);
}

function isSelected(service, key) {
  return keysOf(service.selectedColumns).includes(key);
}

module(
  'AI generated | Unit | Service | column-configuration',
  function (hooks) {
    setupTest(hooks);

    hooks.beforeEach(function () {
      window.localStorage.clear();
      this.service = this.owner.lookup('service:column-configuration');
    });

    hooks.afterEach(function () {
      window.localStorage.clear();
    });

    module('initialize', function () {
      test('builds the default configuration for the given fields and context', function (assert) {
        this.service.initialize(FIELDS, CONTEXT);

        assert.strictEqual(this.service.context, CONTEXT);
        assert.strictEqual(this.service.storageKey, STORAGE_KEY);
        assert.deepEqual(this.service.configuration, [
          { key: 'title', isFixed: true, isSelected: true, position: 0 },
          { key: 'description', isFixed: true, isSelected: true, position: 1 },
          { key: 'blueprint', isFixed: false, isSelected: false, position: 2 },
          {
            key: 'organization',
            isFixed: false,
            isSelected: true,
            position: 3,
          },
          { key: 'created', isFixed: false, isSelected: false, position: 4 },
        ]);
      });

      test('keeps the existing configuration when re-initialized with the same context', function (assert) {
        this.service.initialize(FIELDS, CONTEXT);
        this.service.deselectColumn('organization');
        this.service.initialize(FIELDS, CONTEXT);

        assert.false(isSelected(this.service, 'organization'));
      });

      test('rebuilds the configuration when initialized with a different context', function (assert) {
        this.service.initialize(FIELDS, CONTEXT);
        this.service.deselectColumn('organization');
        this.service.initialize(FIELDS, 'another-context');

        assert.true(isSelected(this.service, 'organization'));
        assert.strictEqual(
          this.service.storageKey,
          'COLUMN_CONFIGURATION_another-context',
        );
      });
    });

    module('derived state', function (hooks) {
      hooks.beforeEach(function () {
        this.service.initialize(FIELDS, CONTEXT);
      });

      test('sortedConfiguration returns the columns ordered by position', function (assert) {
        this.service.reorderColumns(['organization', 'title']);

        assert.deepEqual(keysOf(this.service.sortedConfiguration), [
          'organization',
          'description',
          'blueprint',
          'title',
          'created',
        ]);
      });

      test('selectedColumns returns only the selected columns, in position order', function (assert) {
        assert.deepEqual(keysOf(this.service.selectedColumns), [
          'title',
          'description',
          'organization',
        ]);
      });

      test('areAllColumnsSelected is true only when every column is selected', function (assert) {
        assert.false(this.service.areAllColumnsSelected);

        this.service.selectAllColumns();

        assert.true(this.service.areAllColumnsSelected);
      });
    });

    module('columns', function (hooks) {
      hooks.beforeEach(function () {
        this.service.initialize(FIELDS, CONTEXT);
      });

      test('maps the selected keys back onto the field definitions, excluding attached fields', function (assert) {
        const columns = this.service.columns;

        assert.deepEqual(keysOf(columns), ['title', 'organization']);
        assert.strictEqual(columns[0].label, 'Titel');
        assert.strictEqual(columns[1].label, 'Opgeladen door');
      });

      test('exposes selected attached fields on their host column, and omits unselected ones', function (assert) {
        assert.deepEqual(this.service.columns[0].attachedFields, {
          description: true,
        });

        this.service.setSelectedColumns(['organization', 'blueprint']);

        assert.deepEqual(this.service.columns[0].attachedFields, {
          description: true,
          blueprint: true,
        });
      });
    });

    module('selection mutations', function (hooks) {
      hooks.beforeEach(function () {
        this.service.initialize(FIELDS, CONTEXT);
      });

      test('selectAllColumns selects every column', function (assert) {
        this.service.selectAllColumns();

        assert.deepEqual(keysOf(this.service.selectedColumns), keysOf(FIELDS));
      });

      test('deselectAllColumns keeps the fixed columns selected', function (assert) {
        this.service.deselectAllColumns();

        assert.deepEqual(keysOf(this.service.selectedColumns), [
          'title',
          'description',
        ]);
      });

      test('toggleAllColumns flips between selecting and deselecting everything', function (assert) {
        this.service.toggleAllColumns();

        assert.deepEqual(keysOf(this.service.selectedColumns), keysOf(FIELDS));

        this.service.toggleAllColumns();

        assert.deepEqual(keysOf(this.service.selectedColumns), [
          'title',
          'description',
        ]);
      });

      test('setSelectedColumns selects exactly the given keys plus the fixed ones', function (assert) {
        this.service.setSelectedColumns(['created']);

        assert.deepEqual(keysOf(this.service.selectedColumns), [
          'title',
          'description',
          'created',
        ]);
      });

      test('deselectColumn deselects the given key but ignores a fixed column', function (assert) {
        this.service.deselectColumn('organization');

        assert.false(isSelected(this.service, 'organization'));

        this.service.deselectColumn('title');

        assert.true(isSelected(this.service, 'title'));
      });
    });

    module('reorderColumns', function (hooks) {
      hooks.beforeEach(function () {
        this.service.initialize(FIELDS, CONTEXT);
      });

      test('reassigns the existing positions to the given key order', function (assert) {
        this.service.reorderColumns(['organization', 'title']);

        const positions = Object.fromEntries(
          this.service.configuration.map((column) => [
            column.key,
            column.position,
          ]),
        );

        assert.strictEqual(positions.organization, 0);
        assert.strictEqual(positions.title, 3);
      });

      test('leaves columns outside the given keys untouched', function (assert) {
        this.service.reorderColumns(['organization', 'title']);

        const positions = Object.fromEntries(
          this.service.configuration.map((column) => [
            column.key,
            column.position,
          ]),
        );

        assert.strictEqual(positions.description, 1);
        assert.strictEqual(positions.blueprint, 2);
        assert.strictEqual(positions.created, 4);
      });
    });

    module('persistence', function (hooks) {
      hooks.beforeEach(function () {
        this.service.initialize(FIELDS, CONTEXT);
      });

      test('saveConfiguration writes sequential positions to a context-scoped storage key', function (assert) {
        this.service.reorderColumns(['organization', 'title']);
        this.service.saveConfiguration();

        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));

        assert.deepEqual(keysOf(stored), [
          'organization',
          'description',
          'blueprint',
          'title',
          'created',
        ]);
        assert.deepEqual(
          stored.map((column) => column.position),
          [0, 1, 2, 3, 4],
        );
      });

      test('revertConfiguration restores the last saved configuration', function (assert) {
        this.service.deselectColumn('organization');
        this.service.saveConfiguration();
        this.service.selectAllColumns();
        this.service.revertConfiguration();

        assert.deepEqual(keysOf(this.service.selectedColumns), [
          'title',
          'description',
        ]);
      });

      test('resetConfiguration restores the default configuration, ignoring localStorage', function (assert) {
        this.service.deselectColumn('organization');
        this.service.saveConfiguration();
        this.service.resetConfiguration();

        assert.deepEqual(
          this.service.configuration,
          this.service.defaultConfiguration,
        );
        assert.true(isSelected(this.service, 'organization'));
      });

      test('falls back to the default configuration when the stored value is unusable', function (assert) {
        window.localStorage.setItem(STORAGE_KEY, 'not-json');
        this.service.initialize(FIELDS, 'other');
        this.service.initialize(FIELDS, CONTEXT);

        assert.deepEqual(
          this.service.configuration,
          this.service.defaultConfiguration,
        );

        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ title: true }),
        );
        this.service.initialize(FIELDS, 'other');
        this.service.initialize(FIELDS, CONTEXT);

        assert.deepEqual(
          this.service.configuration,
          this.service.defaultConfiguration,
        );
      });
    });
  },
);
