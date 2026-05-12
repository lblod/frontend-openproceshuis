import {
  isArrayDiverging,
  getCalculatedDifferences,
  removedItemsWhenPropertyEquals,
} from 'frontend-openproceshuis/utils/versioning-comparison';
import { module, test } from 'qunit';

module('Unit | Utility | versioning-comparison', function () {
  test('it can remove items from the array that have property with value', function (assert) {
    const arrayWitArchivedValues = removedItemsWhenPropertyEquals(
      [{ id: '1', isArchived: true }],
      'isArchived',
      true,
    );
    assert.strictEqual(
      arrayWitArchivedValues.length,
      0,
      'item was removed as it had property isArchived: true',
    );
    const arrayWithoutArchivedValues = removedItemsWhenPropertyEquals(
      [{ id: '1', isArchived: true }],
      'isArchived',
      false,
    );
    assert.strictEqual(
      arrayWithoutArchivedValues.length,
      1,
      'item was kept as it had property isArchived: false',
    );
  });

  test('it checks the length of the compared items for isDiverging', function (assert) {
    const current = [];
    const compared = ['different'];
    let isDiverging = isArrayDiverging(current, compared);
    assert.true(isDiverging, 'array length is different');
  });
  test('it checks when simple array values are the same for isDiverging', function (assert) {
    const current = ['value', 3, true];
    let isDiverging = isArrayDiverging(current, current);
    assert.false(isDiverging, 'array length is the same');
  });
  test('it checks when simple array values are different for isDiverging', function (assert) {
    const current = ['value', '3', true];
    const compared = ['value', 3, true];
    let isDiverging = isArrayDiverging(current, compared);
    assert.true(isDiverging, 'array length is same but values differ');
  });
  test('it can calculate the added values when each object has an id', function (assert) {
    const { added } = getCalculatedDifferences([], []);
    assert.strictEqual(added, 0, 'array is empty');
    const { added: oneAdded } = getCalculatedDifferences(
      [{ id: 'addedOne' }],
      [],
    );
    assert.strictEqual(oneAdded, 1, 'current: 1, compared: 0');
    const { added: twoAdded } = getCalculatedDifferences(
      [{ id: 'addedOne' }, { id: 'addedTwo' }],
      [],
    );
    assert.strictEqual(twoAdded, 2, 'current: 2, compared: 0');
    const { added: threeAdded } = getCalculatedDifferences(
      [{ id: 'addedOne' }, { id: 'addedTwo' }, { id: 'addedThree' }],
      [],
    );
    assert.strictEqual(threeAdded, 3, 'current: 3, compared: 0');
  });
  test('it can calculate the removed values', function (assert) {
    const { removed } = getCalculatedDifferences([], []);
    assert.strictEqual(removed, 0, 'array is empty');
    const { removed: removedOne } = getCalculatedDifferences(
      [],
      [{ id: 'removedOne' }],
    );
    assert.strictEqual(removedOne, 1, 'current: 0, compared: 1');
    const { removed: removedTwo } = getCalculatedDifferences(
      [],
      [{ id: 'removedOne' }, { id: 'removedTwo' }],
    );
    assert.strictEqual(removedTwo, 2, 'current: 0, compared: 2');
    const { removed: removedThree } = getCalculatedDifferences(
      [],
      [{ id: 'removedOne' }, { id: 'removedTwo' }, { id: 'removedThree' }],
    );
    assert.strictEqual(removedThree, 3, 'current: 0, compared: 3');
  });
});

module(
  'Unit | Utility | versioning-comparison | Process versioning',
  function () {
    test('it can check if 2 process arrays are diverging', function (assert) {
      const processOne = { id: 'processOne', isArchived: true };
      const processTwo = { id: 'processTwos', isArchived: false };
      assert.true(
        isArrayDiverging([processOne], []),
        'current process array as length one and compare length zero',
      );
      assert.false(
        isArrayDiverging([processOne], [processOne]),
        'models are equal',
      );
      assert.true(
        isArrayDiverging([processOne, processTwo], [processOne]),
        'current has 2 processes compared to the compared array only one of two in current',
      );
    });
    test('it can calculate the added an removed values for 2 process arrays', function (assert) {
      const processOne = { id: 'processOne', isArchived: true };
      const processTwo = { id: 'processTwos', isArchived: false };

      const { added, removed } = getCalculatedDifferences(
        [processOne, processTwo],
        [processOne],
        ['id', 'isArchived'],
      );

      assert.strictEqual(added, 1, 'current: 2, compared: 1, added 1');
      assert.strictEqual(removed, 0, 'current: 2, compared: 1, removed 0');
    });
    test('it can determine the difference between process diagram versions | OPH-1031', function (assert) {
      const currentDiagrams = [
        {
          id: '6A042AB0C99BDC9CF8E5D4B6',
          isArchived: false,
        },
        {
          id: '6A042AAFC99BDC9CF8E5D4B5',
          isArchived: false,
        },
      ];
      const versionedDiagrams = [
        {
          id: '6A042A94C99BDC9CF8E5D4AF',
          isArchived: false,
        },
      ];

      const current = removedItemsWhenPropertyEquals(
        currentDiagrams,
        'isArchived',
        true,
      );
      assert.strictEqual(current.length, 2, 'current has 2 diagrams');
      const versioned = removedItemsWhenPropertyEquals(
        versionedDiagrams,
        'isArchived',
        true,
      );
      assert.strictEqual(versioned.length, 1, 'versioned had 1 diagrams');
      const { added, removed } = getCalculatedDifferences(current, versioned, [
        'id',
        'isArchived',
      ]);

      assert.strictEqual(added, 2, 'current: 2, compared: 1, added 2');
      assert.strictEqual(removed, 1, 'current: 2, compared: 1, removed 1');
    });
    test('it can determine the difference between process attachment versions | OPH-1031', function (assert) {
      const currentAttachments = [
        {
          id: '6a042be73dbf6d000c000008',
          isArchived: true,
        },
        {
          id: '6a042be83dbf6d000c00000a',
          isArchived: false,
        },
        {
          id: '6a042bc93dbf6d000c000006',
          isArchived: false,
        },
        {
          id: '6a042be83dbf6d000c00000c',
          isArchived: false,
        },
      ];
      const versionedAttachments = [
        {
          id: '6a042be73dbf6d000c000008',
          isArchived: true,
        },
        {
          id: '6a042be83dbf6d000c00000a',
          isArchived: false,
        },
        {
          id: '6a042bc93dbf6d000c000006',
          isArchived: false,
        },
        {
          id: '6a042be83dbf6d000c00000c',
          isArchived: false,
        },
      ];

      const current = removedItemsWhenPropertyEquals(
        currentAttachments,
        'isArchived',
        true,
      );
      assert.strictEqual(current.length, 3, 'current attachments is 3');
      const versioned = removedItemsWhenPropertyEquals(
        versionedAttachments,
        'isArchived',
        true,
      );
      assert.strictEqual(versioned.length, 3, 'versioned attachments is 4');
      const { added, removed } = getCalculatedDifferences(current, versioned, [
        'id',
        'isArchived',
      ]);

      assert.strictEqual(added, 0, 'current: 3, compared: 4, added 0');
      assert.strictEqual(removed, 0, 'current: 3, compared: 4, removed 0');
    });
  },
);
