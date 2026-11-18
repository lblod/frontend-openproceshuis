import { module, test } from 'qunit';
import { setupTest } from 'frontend-openproceshuis/tests/helpers';

module('Unit | Service | field', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    let service = this.owner.lookup('service:field');
    assert.ok(service);
  });
});
