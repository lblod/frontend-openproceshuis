import { module, test } from 'qunit';
import { setupRenderingTest } from 'frontend-openproceshuis/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | file/metadata', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<File::Metadata />`);

    assert.dom().hasText('');

    // Template block usage:
    await render(hbs`
      <File::Metadata>
        template block text
      </File::Metadata>
    `);

    assert.dom().hasText('template block text');
  });
});
