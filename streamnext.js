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
