const deferredStorage = {
    pending: {},
    lastSetTime: {},
    timeout: 100,

    setWhenIdle: function(key, value, { timeout } = {}) {
        let p = this.pending[key]
        if (p) {
            p.value = value
            return p.promise
        }

        timeout = timeout === undefined ? this.timeout : timeout

        p = {}
        const promise = new Promise((resolve, reject) => {
            p = { resolve, reject }
        })
        const id = window.requestIdleCallback(
            deadline => this.processPending(key, deadline),
            { timeout }
        )

        p.id = id
        p.value = value
        p.promise = promise
        p.timeout = timeout
        this.pending[key] = p

        return promise
    },

    processPending: function(key, deadline) {
        if (!this.pending[key]) return

        const { value, resolve, reject, timeout } = this.pending[key]

        if (value === undefined) {
            window.localStorage.removeItem(key)
            delete this.pending[key]
            resolve()
            return
        }

        // defer the set operation again when there is
        // not enough idle time
        if (
            this.lastSetTime[key] &&
            this.lastSetTime[key] > deadline.timeRemaining &&
            !deadline.didTimeout
        ) {
            const id = window.requestIdleCallback(
                deadline => this.processPending(key, deadline),
                { timeout }
            )
            this.pending[key].id = id
            return
        }

        try {
            const start = Date.now()
            const json = JSON.stringify(value)
            window.localStorage.setItem(key, json)
            const end = Date.now()

            this.lastSetTime[key] = end - start
            resolve()
        } catch (e) {
            reject(e)
        } finally {
            delete this.pending[key]
        }
    },

    hasPending: function() {
        return Object.keys(this.pending).length > 0
    },

    /*
     * TODO: maybe return the pending value?
     */
    get: function(key) {
        const json = window.localStorage.getItem(key)
        return json === null ? null : JSON.parse(json)
    },

    remove: function(key) {
        window.localStorage.removeItem(key)

        if (!this.pending[key]) return

        const { id, resolve } = this.pending[key]
        resolve()
        window.cancelIdleCallback(id)
        delete this.pending[key]
    },

    commit: function() {
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
