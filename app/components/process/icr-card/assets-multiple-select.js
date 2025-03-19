import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';

export default class ProcessIcrCardAssetsMultipleSelectComponent extends Component {
  @service store;

  @restartableTask
  *loadInformationAssetsTask(searchParams = '') {
    if (!searchParams) return;

    yield timeout(500);

    return this.assets.filter((asset) =>
      asset.label.toLowerCase().includes(searchParams.trim().toLowerCase())
    );
  }

  // Temp
  assets = [
    { id: '5e89f94e-0569-4fd4-873c-dad047f14175', label: 'abonnement' },
    { id: '076f0d37-52ba-4844-88fd-93a420d4b812', label: 'abonnementsplaats' },
    {
      id: 'ae79a6b7-ae35-4b82-91d6-55638711c3cf',
      label: 'ambulante activiteit',
    },
    {
      id: '99c21667-f98c-4b60-a721-faef1a0ca67a',
      label: 'lang label om te testen',
    },
  ];
}
