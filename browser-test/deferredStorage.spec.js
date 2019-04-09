import "babel-polyfill"
import deferredStorage from "../index.js"

// Helper functions

const range = n =>
    Array.apply(null, Array(n)).map((_, i) => {
        return i
    })

/*
 * - A new IDB is created for testing per each run of the test suite
 *   to make sure clean state
 *
 * Contributor notes:
 *
 * - When writing new test, avoid the need to clean up data after test.
 *   This could be archived simply by not sharing the same key with
 *   different test.
 */
describe("deferredStorage", () => {
    beforeEach(() => localStorage.clear())

    it("getItem() should return null if the key does not exist", async function(done) {
        try {
            const v = await deferredStorage.getItem("not_exist")
            expect(v).toBeNull()
            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("setItem()/getItem() basic test", async function(done) {
        try {
            await deferredStorage.setItem("five", 5)
            const v = await deferredStorage.getItem("five")

            expect(v).toEqual(5)
            done()
        } catch (e) {
            done.fail(e)
        }
    })

    const valuetests = [
        [1, "number"],
        ["foo", "string"],
        [null, "null"],
        [{}, "object"],
        [{ a: "a" }, "object"],
        [[1, 2, 3], "array"]
    ]

    for (const [value, type] of valuetests) {
        it(`setItem() and getItem() should work correctly with data type: ${type}`, async function(done) {
            try {
                const key = `type.test.${type}`
                await deferredStorage.setItem(key, value)
                const actual = await deferredStorage.getItem(key)

                expect(actual).toEqual(value)
                done()
            } catch (e) {
                done.fail(e)
            }
        })
    }

    it("removeItem()", async function(done) {
        try {
            const k = "test.remove.basic"
            await deferredStorage.setItem(k, 5)
            let v = await deferredStorage.getItem(k)
            expect(v).toEqual(5)

            await deferredStorage.removeItem(k)
            v = await deferredStorage.getItem(k)
            expect(v).toBeNull()

            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("removeItem() should work fine with non-exist key", async function(done) {
        try {
            const k = "test.remove.nonexist." + Date.now()
            await deferredStorage.removeItem(k)

            expect(true).toEqual(true) // just to surpress warnning
            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("setItem() should preserve the 'order of call' transaction property", async function(done) {
        try {
            const values = range(100)
            const ps = values.map(v =>
                deferredStorage.setItem("order.test", v)
            )

            await Promise.all(ps)

            const v = await deferredStorage.getItem("order.test")
            expect(v).toEqual(99)

            done()
        } catch (e) {
            done.fail(e)
        }
    })

    it("clear()", async function(done) {
        try {
            const values = range(10)
            const sets = values.map(v =>
                deferredStorage.setItem(`clear.test.${v}`, v)
            )

            await Promise.all(sets)

            deferredStorage.clear()

            const gets = values.map(v =>
                deferredStorage.getItem(`clear.test.${v}`)
            )
            const nvalues = await Promise.all(gets)

            nvalues.forEach(v => expect(v).toBeNull())

            done()
        } catch (e) {
            done.fail(e)
        }
    })
})
