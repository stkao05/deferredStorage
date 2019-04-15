var babel = require("rollup-plugin-babel")

module.exports = function(config) {
    config.set({
        frameworks: ["browserify", "jasmine"],
        files: ["./deferredStorage.spec.js"],
        preprocessors: {
            "./*.spec.js": ["rollup"]
        },
        rollupPreprocessor: {
            plugins: [
                babel({
                    babelrc: false,
                    exclude: "node_modules/**"
                })
            ],
            output: {
                format: "iife",
                name: "deferredStorage.spec.js"
            }
        },
        browserify: {
            debug: true,
            transform: ["babelify"]
        },
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ["ChromeHeadless"]
    })
}
