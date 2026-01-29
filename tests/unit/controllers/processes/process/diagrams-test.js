import { module, test } from 'qunit';
import { setupTest } from 'frontend-openproceshuis/tests/helpers';

module('Unit | Controller | processes/process/diagrams', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    let controller = this.owner.lookup('controller:processes/process/diagrams');
    assert.ok(controller);
  });
});
