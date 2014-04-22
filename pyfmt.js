(function() {
	var fmtcs = [ 'd', 'i' ,'o', 'u', 'x', 'X', 'e', 'E', 'f', 'F', 'g', 'G', 'c', 'r', 's', '%' ],
		fmt_number = ['d', 'i' ,'o', 'u', 'x', 'X', 'e', 'E', 'f', 'F', 'g', 'G'],
		fmt_int = ['d', 'i' ,'u' ],
		fmt_float = ['e', 'E', 'f', 'F', 'g', 'G'],
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
		STATES = { COPY: 0, PERCENT: 1, NAME: 2, FORMAT: 3 },
		JSON;
	try {
		JSON = window.JSON;
	} catch(e) {
		try {
			JSON = require('JSON');
		} catch(e2) {}
	}

	function pyfmt(string, options) {
		this.string = string;
		this.options = options;
		this.space_char = options && typeof options.space !== "undefined" ? options.space : ' ';
		if (options && options.nbsp) {
			this.space_char = '&nbsp;';
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
	pyfmt.prototype.format = function(data) {
		if (data.constructor === Object || data.constructor === Array) {
			return this.parse(data);
		} else {
			// console.log(Array.prototype.slice(arguments, 0));
			return this.parse(Array.prototype.slice.call(arguments, 0));
		}
	}
	pyfmt.prototype.parse = function(data) {
		var len = this.string.length,
			i, c,

			state = STATES.COPY,  // current state
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
			if (state === STATES.COPY) {
				if (scr || c !== '%') {
					res += c;
				} else if (c === '%') {
					state = STATES.PERCENT;
				}
			} else if (state === STATES.PERCENT) {
				if (c === '(') {
					state = STATES.NAME;
				} else if (fmtcs.indexOf(c) >= 0) {
					cur.argcnt = acnt++;
					cur.format = c;
					res += this.format_arg(cur, data);
					cur = {};
					state = STATES.COPY;
				} else if (length_re.test(c)) {
					if (!cur.lenmod) { cur.lenmod = c; }
					else { cur.lenmod += c; }
				} else if (!cur.mod && width_re1.test(c)) {
					cur.mod = c;
				} else if (cur.mod && width_re.test(c)) {
					cur.mod += c;
				} else if (flags_re.test(c)) {
					if (cur.mod) { throw new Error("pyformat: width modifier should go after flags"); }
					cur[flag_map[c]] = true;
				} else {
					throw new Error("pyformat: bad format specifier: " + c);
				}
			} else if (state === STATES.NAME) {
				if (c !== ')') {
					if (!cur.name) {
						cur.name = c;
					} else {
						cur.name += c;
					}
				} else {
					state = STATES.FORMAT;
				}
			} else if (state === STATES.FORMAT) {
				if (fmtcs.indexOf(c) >= 0) {
					cur.format = c;
					res += this.format_arg(cur, data);
					cur = {};
					state = STATES.COPY;
				} else if (length_re.test(c)) {
					if (!cur.lenmod) { cur.lenmod = c; }
					else { cur.lenmod += c; }
				} else if (!cur.mod && width_re1.test(c)) {
					cur.mod = c;
				} else if (cur.mod && width_re.test(c)) {
					cur.mod += c;
				} else if (flags_re.test(c)) {
					if (cur.mod) { throw new Error("pyformat: width modifier should go after flags"); }
					cur[flag_map[c]] = true;
				} else {
					throw new Error("pyformat: bad format specifier: " + c);
				}
			}
		}
		res += this.format_arg(cur, data);
		return res;
	}
	pyfmt.prototype.resolve = function(name, obj) {
		if (name.indexOf('.') <= 0) { return ''; }
		var parts = name.split('.'),
			i, o = obj;
		for (i in parts) {
			if (typeof o[parts[i]] !== "undefined") {
				o = o[parts[i]];
			} else {
				return '';
			}
		}
		return o;
	}
	pyfmt.prototype.format_arg = function(cur, args) {
		var ret = '',
			width, prec, t, i, sc, is_number = false, base = 10;
		if (!cur) { return ''; }
		if (Object.keys(cur).length === 0) { return ret; }
		if (this.is_obj && !cur.name) {
			throw new Error("pyformat: object is passed as argument to a array-based formatting string");
		}
		if (cur.mod) {
			t = cur.mod.split('.');
			width = parseInt(t[0], 10);
			if (t.length === 2) {
				prec = parseInt(t[1], 10);
			}
		}
		// console.log('format_arg', cur);
		if (this.is_obj) {
			// console.log('obj', cur, args);
			if (typeof args[cur.name] !== "undefined") {
				ret = args[cur.name];
			} else if (cur.name.indexOf('.') >= 0) {
				ret = this.resolve(cur.name, args);
			} else {
				throw new Error("pyformat: key " + cur.name + " does not exist in the object");
			}
		} else {
			// console.log('array', cur, args);
			ret = args[cur.argcnt];
		}
		if (fmt_number.indexOf(cur.format) >= 0) {
			is_number = true;
			// console.log('a number');
			if (fmt_int.indexOf(cur.format) >= 0) {
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
			ret = ret.toString();
			if (prec) {
				ret = ret.substr(0, prec);
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
			sc = cur.zero ? '0' : this.space_char;
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