import { setRecentSearch, recentSearchesList } from './recentSearchesWidget.js';
const { algoliasearch, instantsearch } = window;

const searchClient = algoliasearch(
  'latency',
  '6be0576ff61c053d5f9a3225e2a90f76'
);

const search = instantsearch({
  indexName: 'instant_search',
  searchClient,
});

// recent searches local storage key
const RECENT_SEARCHES_LOCAL_STORAGE_KEY = 'ALGOLIA_RECENT_SEARCHES';
// recent searches debouncing
const recentSearchesTimeout = 3000;
let recentSearchesTimerId;

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: '#searchbox',
    queryHook(query, search) {
      // save the query to local storage after a timeout
      clearTimeout(recentSearchesTimerId);
      recentSearchesTimerId = setTimeout(
        () => setRecentSearch(RECENT_SEARCHES_LOCAL_STORAGE_KEY, query),
        recentSearchesTimeout
      );
      search(query);
    },
  }),
  // recent searches widget
  instantsearch.widgets.panel({
    templates: { header: () => 'Recent Searches' },
    hidden(options) {
      return options.items.length == 0;
    },
  })(recentSearchesList)({
    container: '#recent-searches',
    key: RECENT_SEARCHES_LOCAL_STORAGE_KEY,
  }),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
        <article>
          <h1>${components.Highlight({ hit, attribute: 'name' })}</h1>
          <p>${components.Highlight({ hit, attribute: 'description' })}</p>
        </article>
      `,
    },
  }),
  instantsearch.widgets.configure({
    hitsPerPage: 8,
  }),
  instantsearch.widgets.panel({
    templates: { header: () => 'brand' },
  })(instantsearch.widgets.refinementList)({
    container: '#brand-list',
    attribute: 'brand',
  }),

  instantsearch.widgets.pagination({
    container: '#pagination',
  }),
]);
search.start();
