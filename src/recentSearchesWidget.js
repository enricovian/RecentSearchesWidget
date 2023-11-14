import { render as preactRender } from 'preact';
import { html } from 'htm/preact';

const noop = () => {};

/**
 * Get the recent searches list saved under a local storage key
 * @param {*} key local storage key
 */
function getRecentSearches(key) {
  const items = window.localStorage.getItem(key);
  return items ? JSON.parse(items) : [];
}

/**
 * Remove an item from recent searches list saved under a local storage key
 * @param {*} key local storage key
 * @param {*} item item to remove from the recent searches
 */
function removeRecentSearch(key, item) {
  let items = getRecentSearches(key);
  items = items.filter((i) => i !== item);

  return window.localStorage.setItem(key, JSON.stringify(items));
}

/**
 * Add an item to the recent searches list saved under a local storage key
 * @param {*} key local storage key
 * @param {*} item item to be included on the recent searches
 */
export function setRecentSearch(key, item) {
  removeRecentSearch(key, item);
  let items = getRecentSearches(key);

  items = item ? [item, ...items] : items;

  return window.localStorage.setItem(key, JSON.stringify(items));
}

/**
 * Recent Searches connector
 */
function connectRecentSearchesList(renderFn, unmountFn = noop) {
  return function recentSearchesList(widgetParams) {
    const { key } = widgetParams;

    return {
      $$type: 'algolia.recentSearchesList',

      init(initOptions) {
        const { instantSearchInstance } = initOptions;

        renderFn(
          // The render state is the data provided to the render function,
          // necessary to build the UI.
          {
            ...this.getWidgetRenderState(initOptions),
            instantSearchInstance,
          },
          // Calling the function with `isFirstRender=true` lets you perform
          // conditional logic in the render function.
          true
        );
      },

      render(renderOptions) {
        const { instantSearchInstance } = renderOptions;

        renderFn(
          // The render state is the data provided to the render function,
          // necessary to build the UI.
          {
            ...this.getWidgetRenderState(renderOptions),
            instantSearchInstance,
          },
          // Calling the function with `isFirstRender=false` lets you perform
          // conditional logic in the render function.
          false
        );
      },

      dispose(disposeOptions) {
        unmountFn();
      },

      // return an object with the data and APIs you want to expose to the render function.
      getWidgetRenderState({ results, helper }) {
        return {
          items: getRecentSearches(key),
          clickSearch: function (query) {
            helper.setQuery(query);
            helper.search();
          },
          removeSearch: function (query) {
            removeRecentSearch(key, query);
            helper.search(); // trigger rerendering
          },
        };
      },

      getRenderState(renderState, renderOptions) {
        // The global render state is merged with a new one to store the render
        // state of the current widget.
        return {
          ...renderState,
          recentSearchesList: {
            ...renderState.recentSearchesList,
            // You can use multiple `recentSearchesList` widgets in a single
            // app so you need to register each of them separately.
            // Each `recentSearchesList` widget's render state is stored
            // by the `key` it uses.
            [key]: this.getWidgetRenderState(renderOptions),
          },
        };
      },
    };
  };
}

/**
 * Recent Searches renderer
 */
function createRecentSearchesListRenderer({
  container,
  cssClasses = {},
  templates: providedTemplates = {},
}) {
  const containerNode =
    typeof container === 'string'
      ? document.querySelector(container)
      : container;

  const templates = {
    listItem({ item, clickSearch, removeSearch, html }) {
      return html`<li class="ais-RecentSearchesList-item">
        <div
          class="ais-RecentSearchesList-labelText"
          onclick=${function () {
            clickSearch(item);
          }}
        >
          ${item}
        </div>
        <div
          class="ais-RecentSearchesList-remove"
          onclick=${function () {
            removeSearch(item);
          }}
        >
          x
        </div>
      </li>`;
    },
    ...providedTemplates,
  };

  return {
    render({ items, clickSearch, removeSearch }) {
      preactRender(
        html`
          <div class="ais-RecentSearchesList">
            <ul class="ais-RecentSearchesList-list">
              ${items.map((item) =>
                templates.listItem({ item, clickSearch, removeSearch, html })
              )}
            </ul>
          </div>
        `,
        containerNode
      );
    },
    dispose() {
      preactRender(null, containerNode);
    },
  };
}

/**
 * Recent Searches widget
 */
export function recentSearchesList(params) {
  const { container, key, ...connectorParams } = params;
  const { render, dispose } = createRecentSearchesListRenderer({
    container,
  });

  const createWidget = connectRecentSearchesList(render, dispose);

  return {
    ...createWidget({ key, ...connectorParams }),
    $$widgetType: 'algolia.recentSearchesList',
  };
}
