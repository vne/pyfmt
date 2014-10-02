(function() {
	var fmtcs = /[bdiouxXeEfFgGcrs%]/,
		fmt_number = /[diouxXeEfFgG]/,
		fmt_int = /[diu]/,
		// fmt_float = /[eEfFgG]/,
		width_re1 = /[1-9\.]/,   // first symbol of width modifier
		width_re = /[0-9\.]/,    // all other symbols of width modifier
		length_re = /[hlL]/,     // length modifiers (compatibility only)
		flags_re = /[#0\- \+]/,  // flags symbols
		flag_map = {
			"#": "alt",    // use alternate form where appropriate
			"0": "zero",   // left padding with zeroes for numbers
			"-": "left",   // adjust value to the left
			" ": "space",  // add a space between padding and number for positive numbers
			"+": "sign"    // add a sign (+/-) for numbers
		},
		// FSM states
		S = {
			C: 0, // copy
			P: 1, // percent symbol
			N: 2, // variable name
			F: 3  // format
		},
		JSON;
	try {
		JSON = window.JSON;
	} catch(e) {
		try {
			JSON = require('JSON');
		} catch(e) {}
	}

	function pyfmt(s, o) {
		this.string = s;
		this.options = o;
		this.spc = o && typeof o.space !== "undefined" ? o.space : ' ';
		if (o && o.nbsp) {
			this.spc = '&nbsp;';
		}
	}
	pyfmt.upgrade = function() {
		String.prototype.pyfmt = function(data) {
			var string = this.toString();
			if (!arguments.length) { return this; }
			var pf = new pyfmt(string);
			return pf.format.apply(pf, arguments);
		}
		return this;
	}
	pyfmt.prototype.format = function(d) {
		if (typeof d !== "undefined" && (d.constructor === Object || d.constructor === Array)) {
			return this.parse(d);
		} else {
			// console.log(Array.prototype.slice(arguments, 0));
			return this.parse([].slice.call(arguments, 0));
		}
	}
	pyfmt.prototype.parse = function(data) {
		var len = this.string.length,
			i, c,

			state = S.C,  // current state
			scr = 0,              // screening flag
			res = '',             // resulting string
			cur = {},             // current argument
			acnt = 0;             // argument counter
		if (!data || !data.constructor) { return ''; }
		if (data.constructor === Object) {
			this.is_obj = true;
		} else {
			this.is_obj = false;
		}
		this.data = data;

		// console.log('pyformat', this.string, data);
		// console.trace();
		for (i = 0; i < len; i++) {
			c = this.string.charAt(i);
			// console.log('  ', i, state, c, '|', res);
			if (state === S.C) {
				if (scr || c !== '%') {
					res += c;
				} else if (c === '%') {
					state = S.P;
				}
			} else if (state === S.P) {
				if (c === '%') {
					res += c;
					state = S.C;
				} else if (c === '(') {
					state = S.N;
				} else if (fmtcs.test(c)) {
					cur.argcnt = acnt++;
					cur.format = c;
					res += this.arg(cur);
					cur = {};
					state = S.C;
				} else if (length_re.test(c)) {
					if (!cur.lenmod) { cur.lenmod = c; }
					else { cur.lenmod += c; }
				} else if (!cur.mod && width_re1.test(c)) {
					cur.mod = c;
				} else if (cur.mod && width_re.test(c)) {
					cur.mod += c;
				} else if (flags_re.test(c)) {
					if (cur.mod) { throw new Error("width modifier should go after flags"); }
					cur[flag_map[c]] = true;
				} else {
					throw new Error("bad format specifier: " + c);
				}
			} else if (state === S.N) {
				if (c !== ')') {
					if (!cur.name) {
						cur.name = c;
					} else {
						cur.name += c;
					}
				} else {
					state = S.F;
				}
			} else if (state === S.F) {
				if (fmtcs.test(c)) {
					cur.format = c;
					res += this.arg(cur);
					cur = {};
					state = S.C;
				} else if (length_re.test(c)) {
					if (!cur.lenmod) { cur.lenmod = c; }
					else { cur.lenmod += c; }
				} else if (!cur.mod && width_re1.test(c)) {
					cur.mod = c;
				} else if (cur.mod && width_re.test(c)) {
					cur.mod += c;
				} else if (flags_re.test(c)) {
					if (cur.mod) { throw new Error("width modifier should go after flags"); }
					cur[flag_map[c]] = true;
				} else {
					throw new Error("bad format specifier: " + c);
				}
			}
		}
		res += this.arg(cur);
		return res;
	}
	pyfmt.prototype.resolve = function(name) {
		if (name.indexOf('.') <= 0) { return ''; }
		var parts = name.split('.'),
			i, o = this.data, p, idx = -1, re;
		for (i in parts) {
			idx = -1;
			p = parts[i];
			if (re = /(.+)\[(\d+)\]/.exec(p)) {
				idx = re[2];
				p = re[1];
			}
			if (typeof o[p] !== "undefined") {
				o = o[p];
				if ((idx >= 0) && o && o.constructor === Array) {
					if (o.length > idx) {
						o = o[idx];
					} else {
						return '';
					}
				}
			} else {
				return '';
			}
		}
		return o;
	}
	pyfmt.prototype.arg = function(cur) {
		var ret = '',
			width, prec, t, i, sc, is_number = false, base = 10;
		if (!cur) { return ''; }
		if (Object.keys(cur).length === 0) { return ret; }
		if (this.is_obj && !cur.name) {
			throw new Error("object is passed as argument to a array-based formatting string");
		}
		if (cur.mod) {
			t = cur.mod.split('.');
			width = parseInt(t[0], 10);
			if (t.length === 2) {
				prec = parseInt(t[1], 10);
			}
		}
		// console.log('arg', cur);
		if (this.is_obj) {
			// console.log('obj', cur, this.data);
			if (typeof this.data[cur.name] !== "undefined") {
				ret = this.data[cur.name];
			} else if (cur.name.indexOf('.') >= 0) {
				ret = this.resolve(cur.name);
			} else {
				throw new Error("key " + cur.name + " does not exist in the object");
			}
		} else {
			// console.log('array', cur, this.data);
			ret = this.data[cur.argcnt];
		}
		if (fmt_number.test(cur.format)) {
			is_number = true;
			// console.log('a number');
			if (fmt_int.test(cur.format)) {
				ret = parseInt(ret, 10);
				if (prec && prec > 0) { ret = ret.toFixed(prec); }
			} else if (['e', 'E', 'g', 'G'].indexOf(cur.format) >= 0) {
				ret = parseFloat(ret, 10).toExponential();
				if (!prec && cur.alt) {
					ret = ret.toString();
					t = ret.indexOf('e');
					ret = ret.substr(0, t) + '.' + ret.substr(t);
				}
			} else if (['f', 'F'].indexOf(cur.format) >= 0) {
				ret = parseFloat(ret, 10);
				if (prec && prec > 0) {
					ret = ret.toFixed(prec);
				} else if (!prec && cur.alt) {
					ret = ret.toString() + '.';
				}

			// } else if (fmt_float.indexOf(cur.format) >= 0) {
				// ret = parseFloat(ret, 10);
			} else if (cur.format === 'o') {
				base = 8;
				ret = Number(ret).toString(8);
				if (cur.alt && (ret !== 0)) {
					ret = '0' + ret.toString();
				}
			} else if (['x', 'X'].indexOf(cur.format) >= 0) {
				base = 16;
				ret = Number(ret);
				if (isNaN(ret)) {
					ret = 0;
				} else {
					ret = ret.toString(16);
					if (cur.alt && (ret !== 0)) {
						ret = '0x' + ret;
					}
				}
			}

			if (['x','e','f','g'].indexOf(cur.format) >= 0) {
				ret = ret.toString().toLowerCase();
			} else if (['X','E','F','G'].indexOf(cur.format) >= 0) {
				ret = ret.toString().toUpperCase();
			}

			if ((['x', 'X'].indexOf(cur.format) < 0) && isNaN(ret)) { ret = 0; } // just for convenience
		} else if (cur.format === "b") {
			if (ret) { ret = 'true'; }
			else { ret = 'false'; }
		} else if (cur.format === 'c') {
			if (ret && ret.constructor && ret.constructor === String) {
				ret = ret.charAt(0);
			} else {
				if (isNaN(Number(ret))) { ret = ''; }
				else {
					ret = String.fromCharCode(ret);
				}
			}
		} else if (cur.format === 'r') {
			// console.log('format - r');
			if (JSON) {
				ret = JSON.stringify(ret);
				if (prec) {
					ret = ret.substr(0, prec);
				}
			} else {
				throw new Error("No JSON library is available, couldn't use the %r format specifier. Please, install JSON.js or use a modern browser");
			}
		} else if (cur.format === 's') {
			if (typeof ret !== "undefined") {
				ret = ret.toString();
				if (prec) {
					ret = ret.substr(0, prec);
				}
			} else {
				ret = '';
			}
		}

		if (is_number) {
			if (cur.sign && (parseInt(ret, base) >= 0)) {
				ret = '+' + ret.toString();
			} else if (cur.space && (parseInt(ret, base) >= 0)) {
				ret = ' ' + ret.toString();
			} else {
				ret = ret.toString();
			}
		} else {
			ret = ret.toString();
		}
		if (width && width > 0 && ret.length < width) {
			sc = cur.zero ? '0' : this.spc;
			t = width - ret.length;
			if (cur.left) {
				for (i = 0; i < t; i++) {
					ret = ret + sc;
				}
			} else {
				for (i = 0; i < t; i++) {
					ret = sc + ret;
				}
			}
		}
		// console.log("returning", ret);
		return ret.toString();

	}



	try {
		// NodeJS case
		module.exports = pyfmt;
	} catch(e) {
		// browser case
		window.pyfmt = pyfmt;
	}
})();