import { module, test } from 'qunit';
import { setupTest } from 'frontend-openproceshuis/tests/helpers';

module('Unit | Route | processes/process', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:processes/process');
    assert.ok(route);
  });
});
