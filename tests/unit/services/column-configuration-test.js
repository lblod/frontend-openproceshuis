import { module, test } from 'qunit';
import { setupTest } from 'frontend-openproceshuis/tests/helpers';

module('Unit | Service | column-configuration', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    let service = this.owner.lookup('service:column-configuration');
    assert.ok(service);
  });
});
