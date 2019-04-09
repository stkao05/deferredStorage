"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var deferredStorage = function () {
    function deferredStorage() {
        _classCallCheck(this, deferredStorage);

        this.pending = {};
    }

    /*
     * @param {string} key
     * @param {any} value - any serializable value
     * @return {Promise} A Promise that resolves when operation is done.
     *         Note that it does not resolve to any value
     */


    _createClass(deferredStorage, [{
        key: "setItem",
        value: function setItem(key, value) {
            var _this = this;

            var p = this.pending[key];

            if (p) {
                p.value = value;
                return p.promise;
            }

            p = {};
            var promise = new Promise(function (resolve, reject) {
                p = { resolve: resolve, reject: reject };
            });

            p.value = value;
            p.promise = promise;

            window.requestIdleCallback(function () {
                return _this.processPending(key);
            }, {
                timeout: 50
            });

            return promise;
        }
    }, {
        key: "processPending",
        value: function processPending(key) {
            // when clear() was called, pending operation will be removed
            if (!this.pending[key]) return;

            var _pending$key = this.pending[key],
                value = _pending$key.value,
                resolve = _pending$key.resolve,
                reject = _pending$key.reject;


            try {
                if (value === undefined) {
                    localStorage.removeItem(value);
                } else {
                    var json = JSON.stringify(value);
                    localStorage.setItem(json);
                }
                resolve();
            } catch (e) {
                reject(e);
            } finally {
                delete this.pending[key];
            }
        }
    }, {
        key: "synchronousGetItem",
        value: function synchronousGetItem() {}
    }, {
        key: "getItem",
        value: function getItem(key) {
            if (this.pending[key]) {
                var _pending$key2 = this.pending[key],
                    promise = _pending$key2.promise,
                    value = _pending$key2.value;

                return promise.resolve(function () {
                    return value;
                });
            }

            return new Promise(function (resolve, reject) {
                try {
                    var json = localStorage.getItem(key);
                    if (json === undefined) return json;

                    resolve(JSON.parse(json));
                } catch (e) {
                    reject(e);
                }
            });
        }
    }, {
        key: "removeItem",
        value: function removeItem(key) {
            return this.setItem(key, undefined);
        }
    }, {
        key: "clear",
        value: function clear() {
            localStorage.clear();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.pending[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    this.pending[key].resolve();
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.pending = {};
        }
    }]);

    return deferredStorage;
}();

exports.default = new deferredStorage();
