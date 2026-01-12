import { modifier } from 'ember-modifier';
import config from './../config/environment';

const defaultQuery =
  config.yasgui.defaultQuery !== '{{YASGUI_DEFAULT_QUERY}}'
    ? config.yasgui.defaultQuery
    : `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT * WHERE {
  ?sub ?pred ?obj .
} LIMIT 10
    `;

export default modifier(function yasgui(element /*, params, hash*/) {
  Promise.all([
    import('@triply/yasgui'),
    import('@triply/yasgui/build/yasgui.min.css'),
  ]).then(([module]) => {
    const Yasgui = module.default;
    const yasgui = new Yasgui(element, {
      requestConfig: { endpoint: '/sparql' },
      autofocus: true,
    });
    yasgui.config.yasqe.value = defaultQuery;
    if (config.yasgui.extraPrefixes !== '{{YASGUI_EXTRA_PREFIXES}}')
      yasgui.config.yasqe.addPrefixes(JSON.parse(config.yasgui.extraPrefixes));
  });
});
