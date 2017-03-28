var Stream = require('../stream.js');
// A[N] * 2 + 1
exports.StreamTest = class {
	constructor(N) {
		this.N = N;
	}
	
	source() {
		var me = this;
		var current = 0;
		var stream = new Stream.Stream(function(batchsize, cb) {
			var out = false;
			setImmediate(function() {
				if (current + batchsize >= me.N) {
					batchsize = me.N - current;
					out = true;
				}
				
				var newarr = new Array(batchsize);
				for(var i = 0; i < batchsize; i++) {
					newarr[i] = i + current;
				}
				current += batchsize;
				cb(out, newarr);
			});
		});
		return stream;
	}

	trans() {
		var instream = this.source();
		var stream = new Stream.Stream(instream, function(out, data, cb) {
			setImmediate(function() {
				var newarr = new Array(data.length);
				for(var i = 0; i < data.length; i++) {
					newarr[i] = data[i] * 2;
				}
				cb(out, newarr);
			});
		});

		return stream;
	}

	dest() {
		var instream = this.trans();

		var stream = new Stream.Stream(instream, function(out, data, cb) {
			setImmediate(function() {
				var newarr = new Array(data.length);
				for(var i = 0; i < data.length; i++) {
					newarr[i] = data[i] + 1;
				}
				cb(out, newarr);
			});
		});

		return stream;
	}
};


exports.StreamNextTest = class {
	constructor(N) {
		this.currenti = 0;
		this.N = N;
	}
	
	eachAsync(cb) {
		var me = this;
		function loop() {
			if (me.currenti == me.N) {
				me.cbres();
				return;
			}
			
			cb(null, me.currenti*3).then(function() {
				me.currenti++;
				setImmediate(loop);
			});
		}

		loop();
		
		return new Promise(function(res, rej) {
			me.cbres = res;
		});
	}
};
