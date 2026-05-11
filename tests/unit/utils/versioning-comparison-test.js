import { isArrayDiverging } from 'frontend-openproceshuis/utils/versioning-comparison';
import { module, test } from 'qunit';

module('Unit | Utility | versioning-comparison', function () {
  test('it checks the length of the compared items', function (assert) {
    const current = [];
    const compared = ['different'];
    let isDiverging = isArrayDiverging(current, compared);
    assert.true(isDiverging, 'length is different so the arrays are diverging');
  });
  test('it IS NOT diverging when array values are the same ', function (assert) {
    const current = ['value', 3, true];
    const compared = ['value', 3, true];
    let isEqualArrayDiverging = isArrayDiverging(current, compared);
    assert.false(
      isEqualArrayDiverging,
      'not diverging when array values are EQUAL',
    );
  });
  test('it IS diverging when array values are different', function (assert) {
    const current = ['value', '3', true];
    const compared = ['value', 3, true];
    let isEqualArrayDiverging = isArrayDiverging(current, compared);
    assert.true(
      isEqualArrayDiverging,
      'diverging when array values are NOT EQUAL',
    );
  });
});
