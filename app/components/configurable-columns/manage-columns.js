import Component from '@glimmer/component';

import { service } from '@ember/service';

export default class ConfigurableColumnsManageColumns extends Component {
  @service('field') fieldService;
}
