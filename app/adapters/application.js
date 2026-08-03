import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class ApplicationAdapter extends JSONAPIAdapter {
  constructor() {
    super(...arguments);
    this.monkeyPatchFetch();
  }

  buildURL(modelName, id, snapshot, requestType, query) {
    // Query object containing
    //   'paramKey': ['paramValueA', 'paramValueB']
    // Should lead to URL containing query params
    //   paramKey=paramValueA&paramKey=paramValueB
    // Instead of
    //   paramKey[]=paramValueA&paramKey[]=paramValueB

    let url = super.buildURL(modelName, id, snapshot, requestType, query);

    if (query) {
      const customParams = [];

      for (let key in query) {
        if (Array.isArray(query[key])) {
          query[key].forEach((item) => {
            customParams.push(
              `${encodeURIComponent(key)}=${encodeURIComponent(item)}`,
            );
          });
          delete query[key];
        }
      }

      if (customParams.length > 0) {
        const customQueryString = customParams.join('&');
        url += `?${customQueryString}`;
      }
    }

    return url;
  }

  async withRetries(url, options, originalFetch) {
    const newOptions = { ...(options || { method: 'GET' }) };
    if (['GET', 'PATCH'].indexOf(newOptions.method) < 0) {
      return originalFetch(url, newOptions);
    }
    const timeout = {
      GET: 3000,
      PATCH: 3000,
    };
    let retries = 3;
    let response = null;
    let abortionTimeout = null;
    while (retries > 0 && !response?.ok) {
      if (retries > 1) {
        response = null;
        const aborter = new AbortController();
        newOptions.signal = aborter.signal;
        // need to do manual timeout handling because we don't want the body to
        // be cancelled if it's not been read yet but the request has succeeded
        // this is the default behavior of AbortSignal.timeout
        abortionTimeout = setTimeout(() => {
          if (!response) {
            aborter.abort();
          }
        }, timeout[newOptions.method] || 1000);
      } else {
        // if it's our last shot, try without timeout
        newOptions.signal = undefined;
      }
      try {
        response = await originalFetch(url, newOptions);
        if (abortionTimeout) {
          clearTimeout(abortionTimeout);
        }

        if (response.ok) {
          return response;
        } else {
          retries = retries - 1;
        }
      } catch (error) {
        retries = retries - 1;
        console.error(`Fetch failed (${retries} left) for ${url} with error:`);
      }
    }
    if (!response) {
      throw new Error(`Failed to fetch ${url} after retries.`);
    }
    return response;
  }

  monkeyPatchFetch() {
    const originalFetch = window.fetch;
    const self = this;
    window.fetch = async function () {
      const response = await self.withRetries(
        arguments[0],
        arguments[1],
        originalFetch,
      );
      return response;
    };
  }
}
