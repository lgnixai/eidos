Each folder here contains the implementation of a view. Standard views need to implement a common interface.

1. Response to navigateSearch event. When users navigate through search results, a custom `navigateSearch` event is triggered.

```ts
const navigateEvent = new CustomEvent("navigateSearch", {
  detail: {
    direction,
    currentIndex: currentSearchIndex,
    total: searchResults.length,
  },
```
