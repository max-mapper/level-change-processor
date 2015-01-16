var Writable = require('readable-stream').Writable
var inherits = require('inherits')

module.exports = Processor

function Processor(opts) {
  if (!(this instanceof Processor)) return new Processor(opts)
  var self = this

  this.options = opts || {}
  var db = this.db = this.options.db
  var worker = this.worker = this.options.worker
  var feed = this.feed = this.options.feed
  
  this.key = opts.key || 'latest'
  this.dbOptions = opts.dbOptions || {valueEncoding: 'utf8'}
  
  db.get(this.key, this.dbOptions, function(err, latest) {
    if (self.destroyed) return
    if (err && !err.notFound) return self.emit('error', err)
      
    var parsedLatest
    if (err) parsedLatest = 0
    else parsedLatest = parseInt(latest)
      
    if (isNaN(parsedLatest)) return self.emit('error', new Error('corrupted latest: ' + latest))
    
    self.feedReadStream = feed.createReadStream({since: parsedLatest, live: true})
    self.feedReadStream.pipe(self)
    self.feedReadStream.on('error', function(err) {
      self.emit('error', err)
    })
    
    self.emit('processing', parsedLatest)
  })
  
  Writable.call(this, {objectMode: true, highWaterMark: 16})
}

inherits(Processor, Writable)

Processor.prototype._write = function(obj, enc, cb) {
  var self = this
  this.worker(obj, function(err) {
    if (err) return cb(err)
    self.db.put(self.key, obj.change.toString(), self.dbOptions, function(err) {
      if (err) return cb(err)
      cb()
    })
  })
}

Processor.prototype.destroy = function(err) {
  if (this.feedReadStream) this.feedReadStream.destroy(err)
  else self.destroyed = true
}
