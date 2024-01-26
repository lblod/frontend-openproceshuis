import { module, test } from 'qunit';

import { setupTest } from 'frontend-processendatabank/tests/helpers';

module('Unit | Model | user task', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let store = this.owner.lookup('service:store');
    let model = store.createRecord('user-task', {});
    assert.ok(model);
  });
});
