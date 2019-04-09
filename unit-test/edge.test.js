import deferredStorage from "../index"

const range = n =>
    Array.apply(null, Array(n)).map((_, i) => {
        return i
    })

describe("deferredStorage: edge cases", () => {
    // setup global mock for localStroage and requestIdleCallback
    var localStorageMock = (function() {
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
            })
        }
    })()

    const requestIdleCallbackMock = jest.fn()

    Object.defineProperty(window, "localStorage", {
        value: localStorageMock
    })

    Object.defineProperty(window, "requestIdleCallback", {
        value: requestIdleCallbackMock
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("getItem() should return null if no value was set before", async function(done) {
        try {
            const v = await deferredStorage.getItem("not_exist")
            expect(v).toEqual(null)
            done()
        } catch (e) {
            done.fail(e)
        }
    })

    test("basic setItem/getItem", async function() {
        expect.assertions(3)
        await expect(deferredStorage.setItem("five", 5)).resolves.toEqual(
            undefined
        )

        expect(localStorageMock.setItem).lastCalledWith("five", "5")

        await expect(deferredStorage.getItem("five")).resolves.toEqual(5)
    })

    const testDatas = [
        [1, "number"],
        ["foo", "string"],
        [null, "null"],
        [{}, "object"],
        [{ a: "a" }, "object"],
        [[1, 2, 3], "array"]
    ]

    for (const [value, type] of testDatas) {
        test(`setItem/getItem should work correctly with data type: ${type}`, async function() {
            expect.assertions(4)
            const key = `type.test.${type}`

            await expect(deferredStorage.setItem(key, value)).resolves.toEqual(
                undefined
            )

            expect(localStorageMock.setItem).lastCalledWith(
                key,
                JSON.stringify(value)
            )

            await expect(deferredStorage.getItem(key)).resolves.toEqual(value)
            expect(localStorageMock.getItem).lastCalledWith(key)
        })
    }

    test("basic removeItem()", function() {
        const key = "test.remove.basic"
        deferredStorage.removeItem(key)
        expect(localStorageMock.removeItem).lastCalledWith(key)
    })

    test("setItem() should preserve the 'order of call' transaction property", async function() {
        expect.assertions(2)
        const values = range(100)
        const ps = values.map(v => deferredStorage.setItem("order.test", v))

        await Promise.all(ps)

        expect(localStorageMock.setItem).lastCalledWith("order.test", "99")
        expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
    })
})
