# deferredStorage

[![Build Status](https://travis-ci.org/stkao05/deferredStorage.svg?branch=master)](https://travis-ci.org/stkao05/deferredStorage)

[![gzip size](https://travis-ci.org/stkao05/deferredStorage.svg?branch=master)](https://travis-ci.org/stkao05/deferredStorage)

`deferredStorage` is a key-value storage that enables a performant usage of localStorage with the [Background Tasks API](https://www.w3.org/TR/requestidlecallback/) (`requestIdleCallback`).

## Motivations

In the current state of browsers, `localStorage` is still the most stable storage options. However, `localStorage` could pose performance issues when storing data with considerable size or with complex structure due to these properties of `localStorage`:
- It is a synchronous storage
- It only stores string value. When storing non-string value, serialization (i.e. `JSON.strinify`) is needed. Serialization could take up a considerable amount of time when data is large or has a complex structure.

`deferredStorage` address these issues via deferring the JSON serialization and the storing operation with the `requestIdleCallback`; value will not be persisted in the same call frame but only when the browser is in the idle state.

## API Design

Only `setWhenIdle()` call will make processed in the deferred fashion while the rest of API will be carried out synchronously.

This design is made for the practical reason that: data serialization and `localStorage.setItem()` are the only potentially expensive operation. All other `localStorage` APIs are quite performant, and hence could be called directly without performance penality.


## API

#### `setWhenIdle(key, value, options)`

Set a key-value data to localStorage when browser is in the idle state.

- `key`: string
- `value`: Any seriaizable value
- `options`: Optional configuration object
    - `timeout`: If timeout is specified and the value has not been persisted by the time timeout milliseconds have passed, the persistence will be carried out during the next idle period.

Return: A Promise that resolves when the value has been successfully persisted, or when rejects when failed.


#### `hasPending()`

Return: True when there are any set operations that have not been carried out.


#### `commit()`

Forcely complete all pending set operations synchronously in the same call frame. It is mostly called right before window is close to make sure all datas are persisted.

```js
window.addEventListener('beforeunload', function() {
	deferredStorage.commit()
});
```

#### `get(key)`

Return the key's value (deserialized) from localStorage


#### `remove(key)`

Remove key from the localStorage. Synchronous operation.


#### `clear()`

Empty all keys out of the localStorage.


__Installing__

```
npm install deferred-storage
```
