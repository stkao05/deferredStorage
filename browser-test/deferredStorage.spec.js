import "babel-polyfill"
import deferredStorage from "../index.js"

const range = n =>
    Array.apply(null, Array(n)).map((_, i) => {
        return i
    })

describe("deferredStorage", () => {
    beforeEach(() => {
        localStorage.clear()
        deferredStorage.clear()
    })

    it("setWhenIdle() / get() simple test", async function(done) {
        try {
            await deferredStorage.setWhenIdle("five", 5)

            expect(localStorage.getItem("five")).toEqual("5")
            expect(deferredStorage.get("five")).toEqual(5)
            done()
        } catch (e) {
            done.fail(e)
        }
    })

    const VALUE_TYPE_TEST_DATA = [
        [1, "number"],
        ["foo", "string"],
        [null, "null"],
        [{}, "object"],
        [{ a: "a" }, "object"],
        [[1, 2, 3], "array"]
    ]

    for (const [value, type] of VALUE_TYPE_TEST_DATA) {
        it(`setWhenIdle() and get() should work correctly with value type: ${type}`, async function(done) {
            try {
                const key = `type.test.${type}`
                await deferredStorage.setWhenIdle(key, value)

                const actual = deferredStorage.get(key)
                expect(actual).toEqual(value)
                done()
            } catch (e) {
                done.fail(e)
            }
        })
    }

    it("setWhenIdle() when call multiple time, it set the key with the value from the last call", async function(done) {
        try {
            const values = range(100)
            const ps = values.map(v =>
                deferredStorage.setWhenIdle("order.test", v)
            )

            await Promise.all(ps)

            expect(localStorage.getItem("order.test")).toEqual("99")
            expect(deferredStorage.get("order.test")).toEqual(99)

            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("get() should return null if the key does not exist", function() {
        expect(deferredStorage.get("not_exist")).toEqual(null)
    })

    it("setWhenIdle(): when setting a key with undefined, no value should be set.", async function(done) {
        try {
            await deferredStorage.setWhenIdle("undefined_test", undefined)

            expect(localStorage.getItem("undefined_test")).toEqual(null)
            expect(deferredStorage.get("undefined_test")).toEqual(null)
            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("setWhenIdle(): when setting an existing key with undefined, the key should be removed", async function(done) {
        try {
            localStorage.setItem("undefined_test_2", 1)

            await deferredStorage.setWhenIdle("undefined_test_2", undefined)

            expect(localStorage.getItem("undefined_test_2")).toEqual(null)
            expect(deferredStorage.get("undefined_test_2")).toEqual(null)
            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("hasPending(): should return true when there are pending set operation, and return false when all set finishes", async function(done) {
        try {
            const pending = deferredStorage.setWhenIdle("has_pending_test_1", 1)

            expect(deferredStorage.hasPending()).toEqual(true)

            await pending
            expect(deferredStorage.hasPending()).toEqual(false)

            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("hasPending(): should return false when there are no pending operations", function() {
        expect(deferredStorage.hasPending()).toEqual(false)
    })

    it("remove(): should remove an existing key from the localStorage", function() {
        localStorage.setItem("remove_test", 1)
        deferredStorage.remove("remove_test")

        expect(localStorage.getItem("remove_test")).toEqual(null)
        expect(deferredStorage.get("remove_test")).toEqual(null)
    })

    it("remove(): should not result in error when call with non-exist key", function() {
        deferredStorage.remove("remove_test_2")
    })

    it("remove(): should cancel the any pending setWhenIdle() with the same key", async function(done) {
        try {
            const pending = deferredStorage.setWhenIdle(
                "remove_pending_test",
                1
            )

            deferredStorage.remove("remove_pending_test")
            await pending

            expect(localStorage.getItem("remove_pending_test")).toEqual(null)
            expect(deferredStorage.get("remove_pending_test")).toEqual(null)
            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("clear(): shoule remove all keys from the localStorage", function() {
        localStorage.setItem("clear_test_a", 1)
        localStorage.setItem("clear_test_b", 2)

        deferredStorage.clear()

        expect(localStorage.length).toEqual(0)
    })

    it("clear(): should cause all pending setWhenIdle() call to resolve", async function(done) {
        try {
            const values = range(10)
            const pendings = values.map(v =>
                deferredStorage.setWhenIdle(`clear.test.${v}`, v)
            )

            deferredStorage.clear()

            await Promise.all(pendings)
            expect(localStorage.length).toEqual(0)

            done()
        } catch (e) {
            done.fail(e)
        }
    })
})
