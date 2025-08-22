import { module, test } from 'qunit';
import { setupRenderingTest } from 'frontend-openproceshuis/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | collapsible-table', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<CollapsibleTable />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <CollapsibleTable>
        template block text
      </CollapsibleTable>
    `);

    assert.dom().hasText('template block text');
  });
});
