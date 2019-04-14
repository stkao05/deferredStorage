# deferredStorage

`deferredStorage` is a key-value storage that enables a more performant usage of `localStorage` via making use of the [Background Tasks API](https://www.w3.org/TR/requestidlecallback/) (requestIdleCallback)

In the current state of browsers, `localStorage` is still the most stable storage options. However, `localStorage` could pose performance issues when storing data with considerable size or with complex structure due to these properties of `localStorage`:
- It is a synchronous storage
- It only stores string value. When storing non-string value, serialization (i.e. `JSON.strinify`) is needed. Serialization could take up a considerable amount of time when data is large or has a complex structure.

`deferredStorage` address these issues via deferring the JSON serialization and the storing operation with the `requestIdleCallback`; value will not be persisted in the same call frame but only when the browser is in the idle state.


## API

##### `setWhenIdle(key, value, options)`

- `key`: string
- `value`: Any seriaizable value
- `options`: Optional configuration object
    - `timeout`: If timeout is specified and the value has not been persisted by the time timeout milliseconds have passed, the persistence will be carried out during the next idle period.

__Return__
A Promise that resolves when the value has been successfully persisted, or when rejects when failed.
