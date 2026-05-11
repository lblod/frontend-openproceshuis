import { isArrayDiverging } from 'frontend-openproceshuis/utils/versioning-comparison';
import { module, test } from 'qunit';

module('Unit | Utility | versioning-comparison', function () {
  test('it checks the length of the compared items', function (assert) {
    const current = [];
    const compared = ['different'];
    let isDiverging = isArrayDiverging(current, compared);
    assert.true(isDiverging);
  });
  test('it checks when simple array values are the same ', function (assert) {
    const current = ['value', 3, true];
    const compared = ['value', 3, true];
    let isDiverging = isArrayDiverging(current, compared);
    assert.false(isDiverging);
  });
  test('it checks when simple array values are different', function (assert) {
    const current = ['value', '3', true];
    const compared = ['value', 3, true];
    let isDiverging = isArrayDiverging(current, compared);
    assert.true(isDiverging);
  });
  test('it checks the id if objects are in the array and not properties are defined to check on', function (assert) {
    const modelA = { id: '101' };

    let isDiverging = isArrayDiverging([modelA], [modelA]);
    assert.false(isDiverging);
  });
  test('it checks specific properties for divergence', function (assert) {
    const current = { id: '1', isArchived: true };
    const compared = { id: '1', isArchived: false };

    assert.false(
      isArrayDiverging([current], [compared], ['id']),
      'Not different when checking only id',
    );
    assert.true(
      isArrayDiverging([current], [compared], ['isArchived']),
      'Is different when checking the isArchived property',
    );
  });
});
