import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class InventoryController extends Controller {
  @service currentSession;
}
