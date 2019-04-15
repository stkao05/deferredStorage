import babel from "rollup-plugin-babel"

export default {
    input: "index.js",
    plugins: [
        babel({
            babelrc: false,
            exclude: "node_modules/**"
        })
    ],
    output: [
        {
            file: "dist/deferred-storage-iife.js",
            format: "iife",
            name: "idbKeyval"
        },
        {
            file: "dist/deferred-storage-cjs.js",
            format: "cjs"
        },
        {
            file: "dist/deferred-storage.mjs",
            format: "es"
        },
        {
            file: "dist/deferred-storage-amd.js",
            format: "amd"
        }
    ]
}
