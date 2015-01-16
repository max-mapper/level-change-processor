# level-change-processor

[![NPM](https://nodei.co/npm/level-change-processor.png)](https://nodei.co/npm/level-change-processor/)

[![Build Status](https://travis-ci.org/maxogden/level-change-processor.svg?branch=master)](https://travis-ci.org/maxogden/level-change-processor)
![dat](http://img.shields.io/badge/Development%20sponsored%20by-dat-green.svg?style=flat)

Follows a [changes-feed](http://npmjs.org/changes-feed) and processes each entry, storing state in a [levelup](http://npmjs.org/levelup). Automatically handles resuming the changes processing from where it left off when restarted.

Designed for creating secondary indexes with leveldb but can be used in many different applications.

## Usage

### `require('level-change-processor')(opts)`

Construct a new change processor instance.

`opts` is an object:

- `db` (*required*) - a levelup to store the change state in
- `feed` (*required*) - a `changes-feed` instance
- `worker` (*required*) - a function (see below) that processes each change
- `key` (default `latest`) - a key to use to store the change state in the `db` above
- `dbOptions` (default `{valueEncoding: 'utf8'}`) - options to pass to the `db` `.get` and `.put` calls

example:

```js
var processor = changeProcessor({
  db: stateDb,
  feed: feed,
  worker: worker
})
```

#### Worker function

A function that takes two arguments: `(change, cb)`.

`change` will be an object with these properties:

- `change` - this will be a js `Number` that increments by 1 for every change, starting at `1`
- `value` - this will be the change payload that the changes feed writes to you. usually is a `Buffer` but depends on the feed

These are the two guaranteed properties. There may be other properties on `change` depending on the feed.

#### error handling

To catch errors attach a `processor.on('error', errorHandler)` event
