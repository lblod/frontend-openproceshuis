import { module, test } from 'qunit';
import { setupTest } from 'frontend-openproceshuis/tests/helpers';
import ENV from 'frontend-openproceshuis/config/environment';

module('Unit | Sanity', function (hooks) {
  setupTest(hooks);

  test('Application route resolves', function (assert) {
    assert.strictEqual(ENV.modulePrefix, 'frontend-openproceshuis');
  });
});
