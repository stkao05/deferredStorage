module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: ['./deferredStorage.spec.dist.js'],
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['Chrome']
  })
}
