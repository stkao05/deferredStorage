const deferredStorage = {
    pending: {},
    setTime: {},
    timeout: 100,

    setItem: function(key, value) {
        let p = this.pending[key]

        if (p) {
            p.value = value
            return p.promise
        }

        p = {}
        const promise = new Promise((resolve, reject) => {
            p = { resolve, reject }
        })
        const id = window.requestIdleCallback(
            deadline => this.processPending(key, deadline),
            {
                timeout: this.timeout
            }
        )

        p.value = value
        p.promise = promise
        p.id = id
        this.pending[key] = p

        return promise
    },

    processPending: function(key, deadline) {
        if (!this.pending[key]) return

        const { value, resolve, reject, skipped } = this.pending[key]

        if (value === undefined) {
            window.localStorage.removeItem(key)
            delete this.pending[key]
            resolve()
            return
        }

        if (
            this.setTime[key] &&
            this.setTime[key] > deadline.timeRemaining &&
            !skipped
        ) {
            const id = window.requestIdleCallback(
                deadline => this.processPending(key, deadline),
                {
                    timeout: this.timeout
                }
            )
            this.pending[key].id = id
            this.pending[key].skipped = true
            return
        }

        try {
            const start = Date.now()
            const json = JSON.stringify(value)
            window.localStorage.setItem(key, json)
            const end = Date.now()

            this.setTime[key] = end - start
            resolve()
        } catch (e) {
            reject(e)
        } finally {
            delete this.pending[key]
        }
    },

    getItem: function(key) {
        if (this.pending[key]) {
            const { promise, value } = this.pending[key]
            return promise.resolve(() => value)
        }

        return new Promise((resolve, reject) => {
            try {
                const value = this.getItemImmediately(key)
                resolve(value)
            } catch (e) {
                reject(e)
            }
        })
    },

    getItemImmediately: function(key) {
        const json = window.localStorage.getItem(key)
        return json === null ? null : JSON.parse(json)
    },

    removeItem: function(key) {
        window.localStorage.removeItem(key)
    },

    commitAll: function() {
        for (const key in this.pending) {
            const { id, value, resolve, reject } = this.pending[key]

            if (value === undefined) {
                window.localStorage.removeItem(key)
                resolve()
            } else {
                try {
                    const json = JSON.stringify(value)
                    window.localStorage.setItem(key, json)
                    resolve()
                } catch (e) {
                    reject(e)
                }
            }

            window.cancelIdleCallback(id)
        }

        this.pending = {}
    },

    clear: function() {
        window.localStorage.clear()

        for (const key in this.pending) {
            this.pending[key].resolve()
            window.cancelIdleCallback(this.pending[key].id)
        }

        this.pending = {}
    }
}

export default deferredStorage
