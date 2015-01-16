var test = require('tape')
var memdb = require('memdb')
var changesFeed = require('changes-feed')
var changeProcessor = require('./')

test('tails the feed', function(t) {
  t.plan(3)
  
  var feedDb = memdb()
  var stateDb = memdb()
  
  var feed = changesFeed(feedDb)
  
  var processor = changeProcessor({
    db: stateDb,
    feed: feed,
    worker: worker
  })
    
  function worker(change, cb) {
    t.ok(change, 'got change')
    t.ok(change.value, 'change.value')
    t.ok(change.change, 'change.change')
    cb()
  }
  
  feed.append('hello')
})

test('restarts from where it left off', function(t) {
  t.plan(7)
  
  var feedDb = memdb()
  var stateDb = memdb()
  
  var feed = changesFeed(feedDb)
  
  var processor = changeProcessor({
    db: stateDb,
    feed: feed,
    worker: worker
  })
    
  var counter = 0
  
  function worker(change, cb) {
    counter++
    t.ok(change, 'got change')
    t.ok(change.change < 3, 'change is < 3')
    
    if (counter === 2) {
      processor.destroy()
      setTimeout(function() {
        var resumedProcessor = changeProcessor({
          db: stateDb,
          feed: feed,
          worker: resumedWorker
        })
        
        function resumedWorker(change, cb) {
          t.ok(change, 'got change after resume')
          t.equals(change.value.toString(), 'hello3', 'got hello3')
          t.equals(change.change, 3, 'got change 3')
          cb()
        }
      }, 500)
    }
    
    cb()
  }
  
  feed.append('hello1')
  feed.append('hello2')
  feed.append('hello3')
})

test('handling errors', function(t) {  
  var feedDb = memdb()
  var stateDb = memdb()
  
  var feed = changesFeed(feedDb)
  
  var processor = changeProcessor({
    db: stateDb,
    feed: feed,
    worker: worker
  })
    
  function worker(change, cb) {}
  
  processor.on('error', function(err) {
    t.ok(err, 'got err')
    t.equals(err.message, 'oh god')
    t.end()
  })
  
  processor.on('processing', function(latest) {
    processor.feedReadStream.destroy(new Error('oh god'))
  })
})
