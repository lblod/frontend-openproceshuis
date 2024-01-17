import { module, test } from 'qunit';
import { setupTest } from 'frontend-processendatabank/tests/helpers';

module('Unit | Service | bpmn-file-upload', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    let service = this.owner.lookup('service:bpmn-file-upload');
    assert.ok(service);
  });
});
