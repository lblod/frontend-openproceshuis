import { module, test } from 'qunit';
import { setupRenderingTest } from 'frontend-openproceshuis/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | class', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Class />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <Class>
        template block text
      </Class>
    `);

    assert.dom().hasText('template block text');
  });
});
