import { module, test } from 'qunit';
import { setupRenderingTest } from 'frontend-openproceshuis/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | configurable-columns/modal',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await render(hbs`<ConfigurableColumns::Modal />`);

      assert.dom().hasText('');

      // Template block usage:
      await render(hbs`
      <ConfigurableColumns::Modal>
        template block text
      </ConfigurableColumns::Modal>
    `);

      assert.dom().hasText('template block text');
    });
  },
);
