# deferredStorage
[![Build Status](https://travis-ci.org/stkao05/deferredStorage.svg?branch=master)](https://travis-ci.org/stkao05/deferredStorage)
[![gzip size](https://img.badgesize.io/https://unpkg.com/deferred-storage@0.0.2/dist/deferred-storage-iife.min.js?compression=gzip)](https://github.com/stkao05/deferredStorage)

deferredStorage is a key-value storage that enables a performant usage of localStorage with the [Background Tasks API](https://www.w3.org/TR/requestidlecallback/) (`requestIdleCallback`).

localStorage is still by far the most stable browser storage, but  potential performance issues could arise when storing data with considerable size or with complex structure due to these properties: 
- localStorage is a synchronous storage
- It only stores string value. When storing non-string value, serialization (i.e. `JSON.strinify`) is needed. Serialization could take up a considerable amount of time when data is large or has a complex structure.

deferredStorage address these issues via deferring the JSON serialization and the storing operation with the `requestIdleCallback`; values will not be persisted in the same call frame but only when the browser is in the idle state.


# Usage

```
npm install deferred-storage
```

```js
import deferredStorage from 'deferred-storage';

deferredStorage
	.set("foo", 1)
	.then(() => console.log("value is saved"))
```



## API

#### `set(key, value, options)`

Set a key-value data to localStorage when browser is in the idle state.

- `key`: string
- `value`: Any seriaizable value
- `options`: Optional configuration object
    - `timeout`: If timeout is specified and the value has not been persisted by the time timeout milliseconds have passed, the persistence will be carried out during the next idle period.

Return: A Promise that resolves when the value has been successfully persisted, or when rejects when failed.


#### `hasPending()`

Return true when there are any `set` calls that have not been completed yet; return false otherwise.

```js
const p = deferredStorage.set("foo", 1)

// true
console.log(deferredStorage.hasPending())

// false
p.then(() => console.log(deferredStorage.hasPending()))
```



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
