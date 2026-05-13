import Application from 'frontend-openproceshuis/app';
import config from 'frontend-openproceshuis/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';
import { loadTests } from 'ember-qunit/test-loader';

setApplication(Application.create(config.APP));

loadTests();
setup(QUnit.assert);

start();
