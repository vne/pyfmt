pyfmt
=====

Python flavored string formatting

Written by Vladimir Neverov <sanguini@gmail.com> in 2014.

Homepage: [https://github.com/vne/sortjs/wiki](https://github.com/vne/sortjs/wiki)

Description
-----------

See [https://docs.python.org/2/library/stdtypes.html#string-formatting](https://docs.python.org/2/library/stdtypes.html#string-formatting) for information about original Python syntax.

This library is intented to simplify formatting of arbitrary data in strings. All Python format specifiers are supported, but not all are handled in exactly the same manner, although the library tries to do its best. Length modifiers are not supported for now, but they are in a roadmap.

pyfmt currently recognizes the following syntax:

	> %(name)[flags]width.precision<format>

where only the % sign and <format> are mandatory:

	> %(varname)#10.4f
	> %(varname)-10.4f
	> %(varname) 10.4f
	> %(varname)+10.4f
	> %(varname)010.4f
	> %(varname)10.4f
	> %(varname)10f
	> %(varname).4f
	> %10.4f
	> %f

Usage
-----

pyfmt can be used both in browser and in NodeJS environments. In NodeJS you should require it first:

	> var pyfmt = require('pyfmt');

This syntax provides the pyfmt class than can be used as follows:

	> var template = new pyfmt("test %d - %d");
	> template.format(5, 10)

There is an alternative that mangles the String object prototype and thus is not enabled by default. You can do it manually:

	> var pyfmt = require('pyfmt').upgrade();

After this you can use the pyfmt method of any string:

	> "test %d - %d".pyfmt(5, 10);

The second method is more like the python syntax, but not everybody likes mangling the built-in objects prototypes, so
this decision is left up to you.

You can use arrays and objects as data providers for string formatting. In case of arrays you can not use names in
format strings. E.g., the following is incorrect:

	> "%(incorrect)d".pyfmt(5)

The exception will be raised in this case. Python behaves the same.

You can pass an array as argument to pyfmt or you can simply specify multiple argument. Both things lead to the same result.

Additions
---------

pyfmt provides some small convenient additions to a standard python syntax. First, you can use nested objects as
data providers:

	> "%(first.second.data)d".pyfmt({ first: { second: { data: 42 } } })

If the path couldn't be resolved, an empty string is inserted instead.

Second, in case when you need left data padding (e.g. when you specify the width of the field: %10s),
it is padded by spaces by default. You can change the symbol that is used for that to any string you like.

	> var template = new pyfmt("%10s", { space: '_' });
	> template.format("test"); // will produce '______test'

You can use special option 'nbsp' to pad data with '&nbsp;':

	> var template = new pyfmt("%6s", { nbsp: true });
	> template.format("test"); // will produce '&nbsp;&nbsp;test'

Tests and examples
------------------

More examples of library usage can be found in **test.js** file. To run tests you will
need [Mocha](http://visionmedia.github.io/mocha/), the tests themselves use built-in
NodeJS [assert](http://nodejs.org/api/assert.html) module.
