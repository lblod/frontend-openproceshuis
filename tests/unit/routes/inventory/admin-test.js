import { module, test } from 'qunit';
import { setupTest } from 'frontend-openproceshuis/tests/helpers';

module('Unit | Route | inventory/admin', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:inventory/admin');
    assert.ok(route);
  });
});
