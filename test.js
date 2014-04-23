var _global, is_nodejs = false;
try {
        var assert, pyfmt;
        _global = window;
} catch(e) {
        _global = global;
        is_nodejs = true;
}

if (is_nodejs) {
        assert = require('assert');
        pyfmt = require('./pyfmt').upgrade();
        JSON = require('JSON');
}

var obj = {
	int: 5,
	flt: 5.25,
	obj: {a:1},
	str: "qwe"
};

describe('pyfmt (prototype method, 1 argument)', function() {
	describe('string format modifier', function() {
		it('should format strings', function() {
			assert.deepEqual("abcdef", "%s".pyfmt(["abcdef"]))
		});
		it('should format integer numbers', function() {
			assert.deepEqual("5", "%s".pyfmt([5]))
		});
		it('should format floats', function() {
			assert.deepEqual("5.25", "%s".pyfmt([5.25]))
		});
		it('should format objects', function() {
			assert.deepEqual("5", "%s".pyfmt(["5"]))
		});
	});
	describe('char format modifier', function() {
		it('should format first character of passed-in string', function() {
			assert.deepEqual("a", "%c".pyfmt(["abcdef"]))
		});
		it('should format character from integer charcode', function() {
			assert.deepEqual("A", "%c".pyfmt([65]))
		});
		it('should return zero for an object argument', function() {
			assert.deepEqual("", "%c".pyfmt([{a:1}]))
		});
	});
	describe('integer format modifier', function() {
		it('should format strings as zeroes', function() {
			assert.deepEqual("0", "%d".pyfmt(["abcdef"]));
		});
		it('should format strings containing numbers as numbers', function() {
			assert.deepEqual("15", "%d".pyfmt(["15"]));
		});
		it('should format strings containing floats as integers', function() {
			assert.deepEqual("5", "%d".pyfmt(["5.25"]));
		});
		it('should format objects as zeroes', function() {
			assert.deepEqual("0", "%d".pyfmt([ {a:1,b:2} ]));
		});
	});
	describe('octal format modifier', function() {
		it('should format strings as zeroes', function() {
			assert.deepEqual("0", "%o".pyfmt(["abcdef"]));
		});
		it('should format strings containing numbers as octal numbers', function() {
			assert.deepEqual("17", "%o".pyfmt(["15"]));
		});
		it('should format strings containing floats as integers', function() {
			assert.deepEqual("5.2", "%o".pyfmt(["5.25"]));
		});
		it('should format objects as zeroes', function() {
			assert.deepEqual("0", "%o".pyfmt([ {a:1,b:2} ]));
		});
		it('should add zero from the left if alternate modifier is used', function() {
			assert.deepEqual("05", "%#o".pyfmt([ 5 ]));
		});
	});
	describe('hex format modifier', function() {
		it('should format strings as zeroes', function() {
			assert.deepEqual("0", "%x".pyfmt(["abcdef"]));
		});
		it('should format strings containing numbers as hex numbers', function() {
			assert.deepEqual("de", "%x".pyfmt(222));
		});
		it('should format numbers as hex numbers with sign', function() {
			assert.deepEqual("-de", "%+x".pyfmt(-222));
		});
		it('should format numbers as hex numbers with space', function() {
			assert.deepEqual(" de", "% x".pyfmt(222));
		});
	});
	describe('float format modifier', function() {
		it('should format strings as zeroes', function() {
			assert.deepEqual("0", "%f".pyfmt(["abcdef"]));
		});
		it('should format integers as integers', function() {
			assert.deepEqual("15", "%f".pyfmt([15]));
		});
		it('should format floats as floats', function() {
			assert.deepEqual("5.25", "%f".pyfmt([5.25]));
		});
		it('should format big floats as floats', function() {
			assert.deepEqual("10000000000", "%f".pyfmt([1e10]));
		});
		it('should format negative big floats as negative floats', function() {
			assert.deepEqual("-10000000000", "%f".pyfmt([-1e10]));
		});
	});
	describe('exponential format modifier', function() {
		it('should format strings as zeroes', function() {
			assert.deepEqual("0", "%e".pyfmt(["abcdef"]));
		});
		it('should format integers as integers', function() {
			assert.deepEqual("1.5e+1", "%e".pyfmt([15]));
		});
		it('should format floats as floats', function() {
			assert.deepEqual("5.25e+0", "%e".pyfmt([5.25]));
		});
		it('should format big floats as floats', function() {
			assert.deepEqual("1e+10", "%e".pyfmt([1e10]));
		});
		it('should format negative big floats as negative floats', function() {
			assert.deepEqual("-1e+10", "%e".pyfmt([-1e10]));
		});
	});
	describe('repr (%r) format modifier', function() {
		it('should format strings as JSON strings', function() {
			assert.deepEqual('"abcdef"', "%r".pyfmt(["abcdef"]))
		});
		it('should format integers as integers', function() {
			assert.deepEqual("5", "%r".pyfmt([5]))
		});
		it('should format floats as floats', function() {
			assert.deepEqual("5.25", "%r".pyfmt([5.25]))
		});
		it('should format objects as their JSON representation', function() {
			assert.deepEqual('{"a":1,"b":2}', "%r".pyfmt([ {a:1,b:2} ]))
		});
	});
	describe('boolean (%b) format modifier', function() {
		it('should return true for natural true boolean format specifier', function() {
			assert.equal("true", "%b".pyfmt(true));
		});
		it('should return false for natural false boolean format specifier', function() {
			assert.equal("false", "%b".pyfmt(false));
		});
		it('should return true for pseudo true boolean format specifier', function() {
			assert.equal("true", "%b".pyfmt(1));
		});
		it('should return false for pseudo false boolean format specifier (0)', function() {
			assert.equal("false", "%b".pyfmt(0));
		});
		it('should return false for pseudo false boolean format specifier ([])', function() {
			assert.equal("false", "%b".pyfmt([]));
		});
		it('should return true for empty object using boolean format specifier ({})', function() {
			assert.equal("true", "%b".pyfmt([{}]));
		});

	});
	describe('format with width modifier', function() {
		it('should pad numbers with spaces from the left', function() {
			assert.deepEqual('   5', "%4d".pyfmt([5]))
		});
		it('should pad strings with spaces from the left', function() {
			assert.deepEqual('   abc', "%6s".pyfmt(["abc"]))
		});
		it('should pad strings with &nbsp; from the left', function() {
			var pyf = new pyfmt("%6s", { nbsp: true });
			assert.deepEqual('&nbsp;&nbsp;&nbsp;abc', pyf.format(["abc"]));
		});
		it('should NOT pad numbers with spaces if the resulting string is longer than the requested length', function() {
			assert.deepEqual('123456789', "%4d".pyfmt([123456789]))
		});
	});
	describe('format with precision modifier', function() {
		it('should add zeroes to integer numbers from the right', function() {
			assert.deepEqual('5.000', "%.3d".pyfmt([5]))
		});
		it('should add zeroes to integer numbers from the right (float passed in)', function() {
			assert.deepEqual('5.000', "%.3d".pyfmt([5.25]))
		});
		it('should add zeroes to float numbers from the right', function() {
			assert.deepEqual('5.250', "%.3f".pyfmt([5.25]))
		});
		it('should cut the strings at length specified by precision', function() {
			assert.deepEqual("abcde", "%.5s".pyfmt(["abcdefqwerty"]))
		});
		it('should cut the JSON object representation at length specified by precision', function() {
			assert.deepEqual('{"a":', "%.5r".pyfmt([{a:1,b:2}]))
		});
	});

});
describe('pyfmt (prototype method, multiple arguments)', function() {
	it('should format all arguments to one string', function() {
		assert.deepEqual('a    5, b5.250, c{"a":1}, d qwe, e', "a%5d, b%5.3f, c%r, d%4s, e".pyfmt([5, 5.25, {a:1}, "qwe"]))
	});
	it('should accept argument list as array', function() {
		assert.deepEqual('a    5, b5.250, c{"a":1}, d qwe, e', "a%5d, b%5.3f, c%r, d%4s, e".pyfmt(5, 5.25, {a:1}, "qwe"))
	});
});
describe('pyfmt (prototype method, object argument)', function() {
	it('should accept object as data', function() {
		assert.deepEqual('a    5, b5.250, c{"a":1}, d qwe, e', "a%(int)5d, b%(flt)5.3f, c%(obj)r, d%4(str)s, e".pyfmt(obj))
	});
	it('should resolve names with dots', function() {
		assert.deepEqual("5", "%(a.b.c)d".pyfmt({ a: { b: { c: 5 } } }))
	});
	it('should resolve names with dots that include arrays', function() {
		assert.deepEqual("10", "%(a.b[1].c)d".pyfmt({ a: { b: [ { c: 5 }, { c: 10 }, { c: 15 } ] } }))
	});
	it('should return zero in case of non-existent name', function() {
		assert.deepEqual("0", "%(q.b[1].c)d".pyfmt({ a: { b: [ { c: 5 }, { c: 10 }, { c: 15 } ] } }))
	});
	it('should return zero in case of non-existent array element', function() {
		assert.deepEqual("0", "%(a.b[4].c)d".pyfmt({ a: { b: [ { c: 5 }, { c: 10 }, { c: 15 } ] } }))
	});
});
describe('pyfmt', function() {
	it('should pad values with zeroes when "0" flag is used', function() {
		assert.deepEqual("00005", "%05d".pyfmt(5));
	});
	it('should adjust value to the left and pad it with spaces from the right', function() {
		assert.deepEqual("5    ", "%-5d".pyfmt(5));
	});
	it('should add a space for a sign for positive numbers', function() {
		assert.deepEqual(" 5", "% d".pyfmt(5));
	});
	it('should NOT add a space for a sign for negative numbers', function() {
		assert.deepEqual("-5", "% d".pyfmt(-5));
	});
	it('should add a + sign for positive numbers', function() {
		assert.deepEqual("+5", "%+d".pyfmt(5));
	});
	it('should add a - sign for negative numbers', function() {
		assert.deepEqual("-5", "%+d".pyfmt(-5));
	});
	it('should add a 0x sign for hex numbers', function() {
		assert.deepEqual("0xde", "%#x".pyfmt(222));
	});
	it('should add a dot for numbers with zero precision formatted by "e"', function() {
		assert.deepEqual(" 5.e+0", "%#6e".pyfmt(5));
	});
	it('should add a dot for numbers with zero precision formatted by "f"', function() {
		assert.deepEqual("    5.", "%#6f".pyfmt(5));
	});
	it('should ignore length modifiers for compatibility', function() {
		assert.deepEqual("     5", "%6hlLf".pyfmt(5));
	});
	it('should NOT ignore other letters in place of length modifiers', function() {
		assert.throws(function() { "%6zf".pyfmt(5); }, Error);
	});
});
describe('pyfmt (lib)', function() {
	it('should format strings with data passed as arguments', function() {
		assert.deepEqual("a5 b5.25", (new pyfmt("a%d b%f")).format(5, 5.25));
	});
	it('should format strings with data passed as array', function() {
		assert.deepEqual("a5 b5.25", (new pyfmt("a%d b%f")).format([5, 5.25]));
	});
	it('should format strings with data passed as object', function() {
		assert.deepEqual("a5 b5.25", (new pyfmt("a%(a)d b%(b)f")).format({a:5, b:5.25}));
	});
});
describe('pyfmt', function() {
	it('shoud return original string for absent data', function() {
		assert.equal("%f", "%f".pyfmt());
	});
});
