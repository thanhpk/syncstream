var assert = require('assert');
var Stream = require('../stream.js');
var test = require('./streamtest.js');
var StreamNext = require('../streamnext.js');

describe('Streaming', function() {
	describe("Stream", function() {
		it('should be ok', function(done) {
			var streamtest = new test.StreamTest(120000);
			var instream = streamtest.dest();

			var current = 0;
			var stream = new Stream.Stream(instream, function(out, data, cb) {
				for (var i in data) {
					assert.equal(current * 2 + 1, data[i]);
					current++;
				}
				
				if (out) {done(); return;}
				cb();
			});
			stream.startPull(1000);
		});

		it('should run if batchsize lesser than total stream size', function(done) {
			var streamtest = new test.StreamTest(12);
			var instream = streamtest.dest();

			var current = 0;
			var stream = new Stream.Stream(instream, function(out, data, cb) {
				for (var i in data) {
					assert.equal(current * 2 + 1, data[i]);
					current++;
				}
				
				if (out) {done(); return;}
				cb();
			});
			stream.startPull(300);
		});

		it('should still call callback when data is out', function(done) {
			var streamtest = new test.StreamTest(2);
			var instream = streamtest.dest();

			var nout = 3;
			var current = 0;
			var stream = new Stream.Stream(instream, function(out, data, cb) {
				for (var i in data) {
					assert.equal(current * 2 + 1, data[i]);
					current++;
				}

				
				if (out) {
					if (nout > 0) {
						nout--;
					} else {
						done();
						return;
					}
				}
				cb();
			});
			stream.startPull(1);
		});
		
		it('should work with odd number', function(done) {
			var streamtest = new test.StreamTest(131);
			var instream = streamtest.dest();

			var current = 0;
			var stream = new Stream.Stream(instream, function(out, data, cb) {
				for (var i in data) {
					assert.equal(current * 2 + 1, data[i]);
					current++;
				}
				
				if (out) {done(); return;}
				cb();
			});
			stream.startPull(21);
		});
	});
	
	describe("streamnext", function() {
		it("should be ok", function(done) {
			var streamnext = new StreamNext.StreamNext();
			var stream = new Stream.Stream(function(batchsize, cb) {
				streamnext.next(batchsize, cb, function() {
					new test.StreamNextTest(10).eachAsync(function(err, doc) {
						return streamnext.promise(batchsize, function(cb) {
							cb(doc);
						});
					}).then(function() {
						streamnext.end();
					});
				});
			});

			var mystream = new Stream.Stream(stream, function(out, data, cb) {

				if (out) {
//					assert.equal(data[data.length - 1], 27);
					done(); return;
				}
				cb();
			});
			mystream.startPull(2);
		});

		it("should throw error when batchsize equal 0", function(done) {
			var streamnext = new StreamNext.StreamNext();
			var stream = new Stream.Stream(function(batchsize, cb) {});
			var mystream = new Stream.Stream(stream, function(out, data, cb) {
			});
			assert.throws(function() {mystream.startPull(0);}, Error);
			done();
		});

		it("should accept odd number", function(done) {
			var streamnext = new StreamNext.StreamNext();
			var stream = new Stream.Stream(function(batchsize, cb) {
				streamnext.next(batchsize, cb, function() {
					new test.StreamNextTest(10).eachAsync(function(err, doc) {
						return streamnext.promise(batchsize, function(cb) {
							cb(doc);
						});
					}).then(function() {
						streamnext.end();
					});
				});
			});

			var mystream = new Stream.Stream(stream, function(out, data, cb) {
				if (out) {done(); return;	}
				cb();
			});
			mystream.startPull(3);
		});

		it("should run if batchsize is bigger than stream size", function(done) {
			var streamnext = new StreamNext.StreamNext();
			var stream = new Stream.Stream(function(batchsize, cb) {
				streamnext.next(batchsize, cb, function() {
					new test.StreamNextTest(10).eachAsync(function(err, doc) {
						return streamnext.promise(batchsize, function(cb) {
							cb(doc);
						});
					}).then(function() {
						streamnext.end();
					});
				});
			});

			var mystream = new Stream.Stream(stream, function(out, data, cb) {
				if (out) {done(); return;}
				cb();
			});
			mystream.startPull(300);
		});

		it("should works with big number", function(done) {
			this.timeout(20000);
			var streamnext = new StreamNext.StreamNext();
			var stream = new Stream.Stream(function(batchsize, cb) {
				streamnext.next(batchsize, cb, function() {
					new test.StreamNextTest(1000).eachAsync(function(err, doc) {
						return streamnext.promise(batchsize, function(cb) {
							cb(doc);
						});
					}).then(function() {
						streamnext.end();
					});
				});
			});

			var mystream = new Stream.Stream(stream, function(out, data, cb) {
				if (out) {done(); return;}
				cb();
			});
			mystream.startPull(1000);
		});
	});
});
