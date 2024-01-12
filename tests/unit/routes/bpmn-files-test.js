import { module, test } from 'qunit';
import { setupTest } from 'frontend-processendatabank/tests/helpers';

module('Unit | Route | bpmn-files', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:bpmn-files');
    assert.ok(route);
  });
});
