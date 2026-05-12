import {
  isArrayDiverging,
  getCalculatedDifferences,
  removedItemsWhenPropertyEquals,
} from 'frontend-openproceshuis/utils/versioning-comparison';
import { module, test } from 'qunit';

module('Unit | Utility | versioning-comparison', function () {
  test('it can remove items from the array that have property with value', function (assert) {
    const withArchived = { id: '1', isArchived: true };
    const withoutArchived = { id: '1', isArchived: false };

    const arrayWitArchivedValues = removedItemsWhenPropertyEquals([
      withArchived,
    ]);
    assert.strictEqual(
      arrayWitArchivedValues.length,
      0,
      'item was removed as it had property isArchived: true',
    );
    const arrayWithoutArchivedValues = removedItemsWhenPropertyEquals([
      withoutArchived,
    ]);
    assert.strictEqual(
      arrayWithoutArchivedValues.length,
      0,
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
