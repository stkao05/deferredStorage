module.exports = function(config) {
    config.set({
        frameworks: ["browserify", "jasmine"],
        files: ["./deferredStorage.spec.js"],
        preprocessors: {
            "./*.spec.js": ["browserify"]
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
