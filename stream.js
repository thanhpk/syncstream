
exports.Stream = class {
	startPull(batchsize) {
		if (batchsize <= 0) throw new Error("batch size must greater than zero");
		this.dest = true;
		this.gimme(batchsize, function(){});
	}
	
	constructor(instream, processingcb) {
		this.buffered = false;
		this.pullrequest = false;
		
		if (processingcb == undefined) {
			this.instream = undefined;
			this.processing = instream;
		} else {
			this.instream = instream;
			this.processing = processingcb;
		}
		this.started = false;
	}

	startNewPull(batchsize) {
		var me = this;
		setImmediate(function() {
			me.pull(batchsize);
		});
	}

	// return data in cb
	gimme(batchsize, cb) { // sync
		if (!this.started) {
			this.startNewPull(batchsize);
			this.started = true;
		}

		if (this.pullrequest && !this.dest) {
			throw "this should not be executed";
		}
		
		this.streamdatacb = undefined;
		if (this.buffered) {
			this.buffered = false;
			
			this.startNewPull(batchsize); 	// start new pull
			cb(this.out, this.data); // give the dataout
		} else {
			if (this.out) {
				cb(this.out, undefined);
				return;
			}
			// stream must be pulling, then just wait for cb
			this.streamdatacb = cb;
			this.pullrequest = true;
		}
	}

	pull(batchsize) { // sync
		var me = this;	
		if (me.buffered) {
			console.log('should not print this'); //only pull when not buffered
		}
		var out, dataout;
		(function(done) {
			if (!me.instream) {
				me.processing(batchsize, function(o, dto) {
					out = o;
					dataout = dto;
					done();
				});
				return;
			}

			me.instream.gimme(batchsize, function(o, dto) {
				me.processing(o, dto, function (o, dto) {
					out = o;
					dataout = dto;
					done();
				});
			});
		})(function() {
			me.buffered = true;
			me.data = dataout;
			me.out = out;
			if (me.pullrequest) {
				if (!me.dest) {
					me.pullrequest = false;
				} else if (me.out) {
					me.pullrequest = false;
				}
				me.buffered = false;
				me.startNewPull(batchsize);
				me.streamdatacb(me.out, me.data);
			} else {
				// just wait for me.stream to be called
			}
		});
	}
};

