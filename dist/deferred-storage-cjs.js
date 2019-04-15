'use strict';

var deferredStorage = {
  pending: {},
  lastSetTime: {},
  timeout: 100,
  setWhenIdle: function setWhenIdle(key, value) {
    var _this = this;

    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        timeout = _ref.timeout;

    var p = this.pending[key];

    if (p) {
      p.value = value;
      return p.promise;
    }

    timeout = timeout === undefined ? this.timeout : timeout;
    p = {};
    var promise = new Promise(function (resolve, reject) {
      p = {
        resolve: resolve,
        reject: reject
      };
    });
    var id = window.requestIdleCallback(function (deadline) {
      return _this.processPending(key, deadline);
    }, {
      timeout: timeout
    });
    p.id = id;
    p.value = value;
    p.promise = promise;
    p.timeout = timeout;
    this.pending[key] = p;
    return promise;
  },
  processPending: function processPending(key, deadline) {
    var _this2 = this;

    if (!this.pending[key]) return;
    var _this$pending$key = this.pending[key],
        value = _this$pending$key.value,
        resolve = _this$pending$key.resolve,
        reject = _this$pending$key.reject,
        timeout = _this$pending$key.timeout;

    if (value === undefined) {
      window.localStorage.removeItem(key);
      delete this.pending[key];
      resolve();
      return;
    } // defer the set operation again when there is
    // not enough idle time


    if (this.lastSetTime[key] !== undefined && this.lastSetTime[key] > deadline.timeRemaining && !deadline.didTimeout) {
      var id = window.requestIdleCallback(function (deadline) {
        return _this2.processPending(key, deadline);
      }, {
        timeout: timeout
      });
      this.pending[key].id = id;
      return;
    }

    try {
      var start = Date.now();
      var json = JSON.stringify(value);
      if (json === undefined) throw new Error("Non JSON serializable value");
      window.localStorage.setItem(key, json);
      var end = Date.now();
      this.lastSetTime[key] = end - start;
      resolve();
    } catch (e) {
      reject(e);
    } finally {
      delete this.pending[key];
    }
  },
  hasPending: function hasPending() {
    return Object.keys(this.pending).length > 0;
  },

  /*
   * TODO: maybe return the pending value?
   */
  get: function get(key) {
    var json = window.localStorage.getItem(key);
    return json === null ? null : JSON.parse(json);
  },
  remove: function remove(key) {
    window.localStorage.removeItem(key);
    if (!this.pending[key]) return;
    var _this$pending$key2 = this.pending[key],
        id = _this$pending$key2.id,
        resolve = _this$pending$key2.resolve;
    resolve();
    window.cancelIdleCallback(id);
    delete this.pending[key];
  },
  commit: function commit() {
    for (var key in this.pending) {
      var _this$pending$key3 = this.pending[key],
          id = _this$pending$key3.id,
          value = _this$pending$key3.value,
          resolve = _this$pending$key3.resolve,
          reject = _this$pending$key3.reject;

      if (value === undefined) {
        window.localStorage.removeItem(key);
        resolve();
      } else {
        try {
          var json = JSON.stringify(value);
          if (json === undefined) throw new Error("Non JSON serializable value");
          window.localStorage.setItem(key, json);
          resolve();
        } catch (e) {
          reject(e);
        }
      }

      window.cancelIdleCallback(id);
    }

    this.pending = {};
  },
  clear: function clear() {
    window.localStorage.clear();

    for (var key in this.pending) {
      this.pending[key].resolve();
      window.cancelIdleCallback(this.pending[key].id);
    }

    this.pending = {};
  }
};

module.exports = deferredStorage;
