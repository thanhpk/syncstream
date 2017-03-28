
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
			if (this.out) return;
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

exports.StreamNext = class {
	next(batchsize, cb, initcb) {
		var me = this;
		if (me.out) return;
		this.returnData = cb;
		if (!me.init) {
			me.init = true;
			me.currenti = 0;
			me.data = new Array(batchsize);
			initcb();
		}

		if (me.ready) {
			me.ready = false;
			me.returnData(me.out, me.data);
			if (me.out) return;
			me.data = new Array(batchsize);
			me.currenti = 0;
			me.cont();
		} else {
			me.pullrequest = true;
		}
	}
	
	promise(batchsize, cb) {
		var me = this;
		var promise = new Promise(function(resolve, reject) {
			me.cont = resolve;
		});

		cb(function(ele) {
			me.data[me.currenti] = ele;
			me.currenti++;
			if (me.currenti == batchsize) {
				if (me.pullrequest) {
					me.pullrequest = false;
					me.returnData(false, me.data);
					me.data = new Array(batchsize);
					me.currenti = 0;
					me.cont();
				} else {
					me.ready = true;
				}
			} else {
				me.cont();
			}
		});
		return promise;
	}

	end() {
		var me = this;
		me.data.length = me.currenti;
		me.out = true;
		if (me.pullrequest) {
			me.pullrequest = false;
			me.ready = true;
			me.returnData(true, me.data);
		} else {
			me.ready = true;
		}
	}
};
