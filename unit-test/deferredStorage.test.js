import deferredStorage from "../index"

// setup global mock for localStroage and requestIdleCallback
const localStorageMock = (function() {
    var store = {}

    return {
        getItem: jest.fn(key => {
            return store[key] || null
        }),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString()
        }),
        removeItem: jest.fn(key => {
            delete store[key]
        }),
        clear: jest.fn(() => {
            store = {}
        }),
        get length() {
            return Object.keys(store).length
        }
    }
})()

const requestIdleCallbackMock = jest.fn()
const cancelIdleCallbackMock = jest.fn()

Object.defineProperty(window, "localStorage", {
    value: localStorageMock
})

Object.defineProperty(window, "requestIdleCallback", {
    value: requestIdleCallbackMock
})

Object.defineProperty(window, "cancelIdleCallback", {
    value: cancelIdleCallbackMock
})

describe("deferredStorage", () => {
    beforeEach(() => {
        localStorageMock.clear()
        deferredStorage.clear()
        jest.clearAllMocks()
    })

    test("setWhenIdle(): should trigger requestIdleCallback()", async function(done) {
        expect.assertions(5)

        expect(requestIdleCallbackMock).toHaveBeenCalledTimes(0)

        const p = deferredStorage.setWhenIdle("test_1", 1, { timeout: 50 })

        expect(requestIdleCallbackMock).toHaveBeenCalledTimes(1)
        expect(localStorageMock.length).toEqual(0)

        const [callback, options] = requestIdleCallbackMock.mock.calls[0]
        expect(options).toEqual({ timeout: 50 })

        const deadline = { didTimeout: false, timeRemaining: 1000 }
        callback(deadline)

        expect(localStorageMock.getItem("test_1")).toEqual("1")
        await p

        done()
    })

    test("setWhenIdle(): when called multiple time with same key, it should only trigger one localStorage.setItem with the last value", async function(done) {
        expect.assertions(2)

        const p1 = deferredStorage.setWhenIdle("test_2", 1)
        const p2 = deferredStorage.setWhenIdle("test_2", 2)
        const p3 = deferredStorage.setWhenIdle("test_2", 3)

        const [callback] = requestIdleCallbackMock.mock.calls[0]

        const deadline = { didTimeout: false, timeRemaining: 1000 }
        callback(deadline)

        expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
        expect(localStorageMock.setItem).toHaveBeenCalledWith("test_2", "3")

        await Promise.all([p1, p2, p3])
        done()
    })

    test("setWhenIdle(): when remaining idle time is less than the last set time, it should defer the set again", async function(done) {
        expect.assertions(5)

        // first setWhenIdle() to allow calculation of last set time
        deferredStorage.setWhenIdle("test_3", 1)
        expect(requestIdleCallbackMock).toHaveBeenCalledTimes(1)
        const [callback] = requestIdleCallbackMock.mock.calls[0]
        callback({ didTimeout: false, timeRemaining: 100 })
        expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)

        // second setWhenIdle should be deferred
        deferredStorage.setWhenIdle("test_3", 2)
        expect(requestIdleCallbackMock).toHaveBeenCalledTimes(2)
        const [callback2] = requestIdleCallbackMock.mock.calls[1]
        callback2({ didTimeout: false, timeRemaining: -1 }) // HACK: use -1 for test convenience
        expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
        expect(requestIdleCallbackMock).toHaveBeenCalledTimes(3)

        done()
    })

    test("remove(): should cancel any pending set with the same key", async function(done) {
        requestIdleCallbackMock.mockReturnValueOnce(555)

        const p = deferredStorage.setWhenIdle("test_4", 1)
        expect(requestIdleCallbackMock).toHaveBeenCalledTimes(1)
        deferredStorage.remove("test_4")

        expect(cancelIdleCallbackMock).toHaveBeenCalledWith(555)

        await p
        done()
    })
})
