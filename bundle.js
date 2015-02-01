(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":5}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":3,"inherits":2}],6:[function(require,module,exports){
/**
 * ESDOM demo app
 */

var esprima = require('esprima');
var esdom = require('esdom');
var q = require('queried');
var e = require('emmy');
var doc = require('get-doc');
var closest = require('query-relative').closest;


/** Create refs */
var codeEl = q('.code');
var astEl = q('.ast');
var selEl = q('.selector');


/** Add events */

//on source change - update DOM tree
e.throttle(codeEl, 'input change', 400, function(e){
	try {
		var ast = esprima.parse(codeEl.value);
		astEl.innerHTML = '';
		astEl.appendChild(esdom.toDOM(ast));
		esdom.analyze(astEl);
	}
	catch (e) {
		astEl.textContent = e.message;
	}

});


//on selector change - highlight nodes
e.throttle(selEl, 'input change', 200, function(e){
	var sel = selEl.value;
});



//Collapse non-empty nodes
e.delegate(doc, 'click', '.Node', function(e){
	if (!e.target.childElementCount) return;

	if (e.target.classList.contains('collapsed')) {
		e.target.classList.remove('collapsed');
	}
	else {
		e.target.classList.add('collapsed');
	}
});


//Highlight scope variables;
e.delegate(doc, 'mouseover', '[data-scope]', function(e){
	e.stopPropagation();
	var scope = closest(e.target, '[data-scope]');
	if (!scope) return;

	//fade each highlighted id
	q.all('.active-scope').forEach(function(el){el.classList.remove('active-scope')});
	q.all('.highlight').forEach(function(el){el.classList.remove('highlight')});

	scope.classList.add('active-scope');
	var scopeId = scope.getAttribute('data-scope');

	//paint each identifier
	q.all('[data-variable-scope="' + scopeId + '"]').forEach(function(el){
		el.classList.add('highlight');
	});
});
},{"emmy":9,"esdom":30,"esprima":93,"get-doc":94,"queried":96,"query-relative":119}],7:[function(require,module,exports){
/**
 * @module  emmy/delegate
 */

//TODO: use jquery delegate, if possible

module.exports = delegate;

var on = require('./on');
var closest = typeof document !== 'undefined' ? require('query-relative/closest') : null;
var isFn = require('mutype/is-fn');
var contains = require('contains');

/**
 * Bind listener to a target
 * listening for all events from it’s children matching selector
 *
 *
 * @param {string} selector A selector to match against
 *
 * @return {function} A callback
 */
function delegate(target, evt, fn, selector){
	return on(target, evt, delegate.wrap(target, evt, fn, selector));
}


delegate.wrap = function(target, evt, fn, selector){
	//ignore non-DOM
	if (!closest) return;

	//swap params, if needed
	if (isFn(selector)) {
		var tmp = selector;
		selector = fn;
		fn = tmp;
	}

	return on.wrap(target, evt, fn, function(e){
		var el = e.target;

		//deny self instantly
		if (el === target) return;


		//find at least one element in-between delegate target and event source
		var holderEl = closest(el, selector, true);

		if (holderEl && target !== holderEl && contains(target, holderEl)) {
			//save source of event
			e.delegateTarget = holderEl;

			//NOTE: PhantomJS && IE8 fails on that:
			// evt.currentTarget = el;
			// Object.defineProperty(evt, 'currentTarget', {
			// 	get: function(){
			// 		return el;
			// 	}
			// });

			return true;
		}
	});
};
},{"./on":26,"contains":13,"mutype/is-fn":19,"query-relative/closest":118}],8:[function(require,module,exports){
/**
 * @module emmy/emit
 */
var icicle = require('icicle');
var slice = require('sliced');
var isString = require('mutype/is-string');
var isNode = require('mutype/is-node');
var isEvent = require('mutype/is-event');
var listeners = require('./listeners');


/**
 * A simple wrapper to handle stringy/plain events
 */
module.exports = function(target, evt){
	if (!target) return;

	var args = arguments;
	if (isString(evt)) {
		args = slice(arguments, 2);
		evt.split(/\s+/).forEach(function(evt){
			evt = evt.split('.')[0];

			emit.apply(this, [target, evt].concat(args));
		});
	} else {
		return emit.apply(this, args);
	}
};


/** detect env */
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;
var doc = typeof document === 'undefined' ? undefined : document;
var win = typeof window === 'undefined' ? undefined : window;


/**
 * Emit an event, optionally with data or bubbling
 * Accept only single elements/events
 *
 * @param {string} eventName An event name, e. g. 'click'
 * @param {*} data Any data to pass to event.details (DOM) or event.data (elsewhere)
 * @param {bool} bubbles Whether to trigger bubbling event (DOM)
 *
 *
 * @return {target} a target
 */
function emit(target, eventName, data, bubbles){
	var emitMethod, evt = eventName;

	//Create proper event for DOM objects
	if (isNode(target) || target === win) {
		//NOTE: this doesnot bubble on off-DOM elements

		if (isEvent(eventName)) {
			evt = eventName;
		} else {
			//IE9-compliant constructor
			evt = doc.createEvent('CustomEvent');
			evt.initCustomEvent(eventName, bubbles, true, data);

			//a modern constructor would be:
			// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })
		}

		emitMethod = target.dispatchEvent;
	}

	//create event for jQuery object
	else if ($ && target instanceof $) {
		//TODO: decide how to pass data
		evt = $.Event( eventName, data );
		evt.detail = data;

		//FIXME: reference case where triggerHandler needed (something with multiple calls)
		emitMethod = bubbles ? targte.trigger : target.triggerHandler;
	}

	//detect target events
	else {
		//emit - default
		//trigger - jquery
		//dispatchEvent - DOM
		//raise - node-state
		//fire - ???
		emitMethod = target['emit'] || target['trigger'] || target['fire'] || target['dispatchEvent'] || target['raise'];
	}


	var args = slice(arguments, 2);


	//use locks to avoid self-recursion on objects wrapping this method
	if (emitMethod) {
		if (icicle.freeze(target, 'emit' + eventName)) {
			//use target event system, if possible
			emitMethod.apply(target, [evt].concat(args));
			icicle.unfreeze(target, 'emit' + eventName);

			return target;
		}

		//if event was frozen - probably it is emitter instance
		//so perform normal callback
	}


	//fall back to default event system
	var evtCallbacks = listeners(target, evt);

	//copy callbacks to fire because list can be changed by some callback (like `off`)
	var fireList = slice(evtCallbacks);
	for (var i = 0; i < fireList.length; i++ ) {
		fireList[i] && fireList[i].apply(target, args);
	}

	return target;
}
},{"./listeners":12,"icicle":14,"mutype/is-event":18,"mutype/is-node":20,"mutype/is-string":21,"sliced":22}],9:[function(require,module,exports){
/**
 * Event Emitter.
 *
 * @module  emmy
 */


//TODO: normalize cross-browser events like animationend
//TODO: implement unobtrusize approach to store callbacks (unlike component-emitter)
//TODO: implement classes scoping


var	on = require('./on'),
	off = require('./off'),
	once = require('./once'),
	emit = require('./emit'),
	listeners = require('./listeners'),
	keypass = require('./keypass'),
	throttle = require('./throttle'),
	later = require('./later'),
	delegate = require('./delegate'),
	not = require('./not'),
	slice = require('sliced');



/**
 * @constructor
 *
 * Main Emitter interface.
 */
function Emmy(target){
	if (!target) return;

	//create emitter methods on target
	for (var meth in proto){
		target[meth] = proto[meth];
	}

	return target;
}

var proto = Emmy.prototype;


/** Return chaining method */
function getWrappedMethod(fn){
	return function(){
		fn.apply(this, [this].concat(slice(arguments)));
		return this;
	};
}


/** Prototype methods are wrapped so to return target for chaining calls */
proto.on = getWrappedMethod(on);
proto.once = getWrappedMethod(once);
proto.off = getWrappedMethod(off);
proto.emit = getWrappedMethod(emit);
proto.listeners = function(a){
	return listeners(this, a);
};
proto.hasListeners = function(a){
	return !!listeners(this, a).length;
};


/**
 * Provide static methods
 */
Emmy.on = on;
Emmy.off = off;
Emmy.once = once;
Emmy.emit = emit;
Emmy.listeners = listeners;
Emmy.keypass = keypass;
Emmy.throttle = throttle;
Emmy.later = later;
Emmy.delegate = delegate;
Emmy.not = not;
Emmy.slice = slice;


module.exports = Emmy;
},{"./delegate":7,"./emit":8,"./keypass":10,"./later":11,"./listeners":12,"./not":24,"./off":25,"./on":26,"./once":27,"./throttle":28,"sliced":22}],10:[function(require,module,exports){
/**
 * @module  emmy/keypass
 */

module.exports = keypass;

var keyDict = require('key-name');
var lower = require('mustring/lower');
var isArray = require('mutype/is-array');
var on = require('./on');
var isString = require('mutype/is-string');


/**
 * Fire event passing key condition
 *
 * @param {Array|String|Number} keys A keys to filter
 *
 * @return {Function} Wrapped handler
 */
function keypass(target, evt, fn, keys){
	return on(target, evt, keypass.wrap(target, evt, fn, keys));
}

/** Return wrapped callback filtering keys */
keypass.wrap = function(target, evt, fn, keys){
	//ignore empty keys
	if (!keys) return;

	//prepare keys list to match against
	keys = isArray(keys) ? keys : isString(keys) ? keys.split(/\s*,\s*/) : [keys];
	keys = keys.map(lower);

	return on.wrap(target, evt, fn, function(e){
		var key, which = e.which !== undefined ? e.which : e.keyCode;
		for (var i = keys.length; i--;){
			key = keys[i];
			if (which == key || keyDict[key] == which) return true;
		}
	});
};
},{"./on":26,"key-name":15,"mustring/lower":16,"mutype/is-array":17,"mutype/is-string":21}],11:[function(require,module,exports){
/**
 * @module  emmy/later
 */

module.exports = later;


var on = require('./on');
var isFn = require('mutype/is-fn');


/**
 * Postpone callback call for N ms
 *
 * @return {Function} Wrapped handler
 */
function later(target, evt, fn, interval) {
	return on(target, evt, later.wrap(target, evt, fn, interval));
}


/** Return wrapped callback */
later.wrap = function(target, evt, fn, interval){
	//swap params, if needed
	if (isFn(interval)) {
		var tmp = interval;
		interval = fn;
		fn = tmp;
	}

	var cb = function(){
		var args = arguments;
		var self = this;

		setTimeout(function(){
			fn.apply(self, args);
		}, interval);
	};

	cb.fn = fn;

	return cb;
};
},{"./on":26,"mutype/is-fn":19}],12:[function(require,module,exports){
/**
 * A storage of per-target callbacks.
 * WeakMap is the most safe solution.
 *
 * @module emmy/listeners
 */

/** Storage of callbacks */
var cache = new WeakMap;


/**
 * Get listeners for the target/evt (optionally)
 *
 * @param {object} target a target object
 * @param {string}? evt an evt name, if undefined - return object with events
 *
 * @return {(object|array)} List/set of listeners
 */
function listeners(target, evt, tags){
	var cbs = cache.get(target);

	if (!evt) return cbs || {};
	if (!cbs || !cbs[evt]) return [];

	var result = cbs[evt];

	//if there are evt namespaces specified - filter callbacks
	if (tags && tags.length) {
		result = result.filter(function(cb){
			return hasTags(cb, tags);
		});
	}

	return result;
}


/**
 * Remove listener, if any
 */
listeners.remove = function(target, evt, cb, tags){
	//get callbacks for the evt
	var evtCallbacks = cache.get(target);
	if (!evtCallbacks || !evtCallbacks[evt]) return false;

	var callbacks = evtCallbacks[evt];

	//if tags are passed - make sure callback has some tags before removing
	if (tags && tags.length && !hasTags(cb, tags)) return false;

	//remove specific handler
	for (var i = 0; i < callbacks.length; i++) {
		//once method has original callback in .cb
		if (callbacks[i] === cb || callbacks[i].fn === cb) {
			callbacks.splice(i, 1);
			break;
		}
	}
};


/**
 * Add a new listener
 */
listeners.add = function(target, evt, cb, tags){
	if (!cb) return;

	//ensure set of callbacks for the target exists
	if (!cache.has(target)) cache.set(target, {});
	var targetCallbacks = cache.get(target);

	//save a new callback
	(targetCallbacks[evt] = targetCallbacks[evt] || []).push(cb);

	//save ns for a callback, if any
	if (tags && tags.length) {
		cb._ns = tags;
	}
};


/** Detect whether an cb has at least one tag from the list */
function hasTags(cb, tags){
	if (cb._ns) {
		//if cb is tagged with a ns and includes one of the ns passed - keep it
		for (var i = tags.length; i--;){
			if (cb._ns.indexOf(tags[i] >= 0)) return true;
		}
	}
}


module.exports = listeners;
},{}],13:[function(require,module,exports){
var DOCUMENT_POSITION_CONTAINED_BY = 16

module.exports = contains

function contains(container, elem) {
    if (container.contains) {
        return container.contains(elem)
    }

    var comparison = container.compareDocumentPosition(elem)

    return comparison === 0 || comparison & DOCUMENT_POSITION_CONTAINED_BY
}

},{}],14:[function(require,module,exports){
/**
 * @module Icicle
 */
module.exports = {
	freeze: lock,
	unfreeze: unlock,
	isFrozen: isLocked
};


/** Set of targets  */
var lockCache = new WeakMap;


/**
 * Set flag on target with the name passed
 *
 * @return {bool} Whether lock succeeded
 */
function lock(target, name){
	var locks = lockCache.get(target);
	if (locks && locks[name]) return false;

	//create lock set for a target, if none
	if (!locks) {
		locks = {};
		lockCache.set(target, locks);
	}

	//set a new lock
	locks[name] = true;

	//return success
	return true;
}


/**
 * Unset flag on the target with the name passed.
 *
 * Note that if to return new value from the lock/unlock,
 * then unlock will always return false and lock will always return true,
 * which is useless for the user, though maybe intuitive.
 *
 * @param {*} target Any object
 * @param {string} name A flag name
 *
 * @return {bool} Whether unlock failed.
 */
function unlock(target, name){
	var locks = lockCache.get(target);
	if (!locks || !locks[name]) return false;

	locks[name] = null;

	return true;
}


/**
 * Return whether flag is set
 *
 * @param {*} target Any object to associate lock with
 * @param {string} name A flag name
 *
 * @return {Boolean} Whether locked or not
 */
function isLocked(target, name){
	var locks = lockCache.get(target);
	return (locks && locks[name]);
}
},{}],15:[function(require,module,exports){
module.exports={
	"⌥": 18, "alt": 18, "option": 18,
	"backspace": 8,
	"capslock": 20, "caps": 20,
	"clear": 12,
	"context": 93,
	"⌘": 91, "cmd": 91, "command": 91,
	"⌃": 17, "ctrl": 17, "control": 17,
	"del": 46, "delete": 46,
	"down": 40,
	"end": 35,
	"⎆": 13, "enter": 13, "return": 13,
	"esc": 27, "escape": 27,
	"home": 36,
	"insert": 45,
	"left": 37,
	"pagedown": 34, "pg-down": 34,
	"pageup": 33, "pg-up": 33,
	"pause": 19,
	"right": 39,
	"⇧": 16, "shift": 16,
	"space": 32,
	"tab": 9,
	"up": 38,

	"F1": 112,
	"F2": 113,
	"F3": 114,
	"F4": 115,
	"F5": 116,
	"F6": 117,
	"F7": 118,
	"F8": 119,
	"F9": 120,
	"F10": 121,
	"F11": 122,
	"F12": 123,

	"leftmouse": 1,
	"rightmouse": 3,
	"middlemouse": 2,

	"*": 106,
	"+": 107, "plus": 107,
	"-": 109, "minus": 109,
	";": 186, "semicolon": 186,
	"=": 187, "equals": 187,
	",": 188,
	"dash": 189,
	".": 190,
	"/": 191,
	"`": 192, "~": 192,
	"[": 219,
	"\\": 220,
	"]": 221,
	"'": 222
}
},{}],16:[function(require,module,exports){
//lowercasify
module.exports = function(str){
	return (str + '').toLowerCase();
}
},{}],17:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],18:[function(require,module,exports){
module.exports = function(target){
	return typeof Event !== 'undefined' && target instanceof Event;
};
},{}],19:[function(require,module,exports){
module.exports = function(a){
	return !!(a && a.apply);
}
},{}],20:[function(require,module,exports){
module.exports = function(target){
	return typeof document !== 'undefined' && target instanceof Node;
};
},{}],21:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],22:[function(require,module,exports){
module.exports = exports = require('./lib/sliced');

},{"./lib/sliced":23}],23:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}],24:[function(require,module,exports){
/**
 * @module  emmy/not
 */

module.exports = not;

var on = require('./on');
var closest = typeof document !== 'undefined' ? require('query-relative/closest') : null;
var isFn = require('mutype/is-fn');
var contains = require('contains');


/**
 * Bind listener to a target
 * listening for all events from it’s children matching selector
 *
 * @param {string} selector A selector to match against
 *
 * @return {function} A callback
 */
function not(target, evt, fn, selector){
	return on(target, evt, not.wrap(target, evt, fn, selector));
}


/** Return wrapper calling fn in case if selector passes */
not.wrap = function(target, evt, fn, selector){
	//ignore non-DOM
	if (!closest) return;

	//swap params, if needed
	if (isFn(selector)) {
		var tmp = selector;
		selector = fn;
		fn = tmp;
	}

	return on.wrap(target, evt, fn, function(e){
		var el = e.target;

		//if element is not in the DOM - ignore evt
		if (!contains(target, el)) return false;

		//If source element or anything in-between it and delegate element matches passed selector - ignore that event

		var res = closest(el, selector);
		if (res && contains(target, res)) return false;
		return true;
	});
};
},{"./on":26,"contains":13,"mutype/is-fn":19,"query-relative/closest":118}],25:[function(require,module,exports){
/**
 * @module emmy/off
 */
module.exports = off;

var icicle = require('icicle');
var slice = require('sliced');
var listeners = require('./listeners');


/**
 * Remove listener[s] from the target
 *
 * @param {[type]} evt [description]
 * @param {Function} fn [description]
 *
 * @return {[type]} [description]
 */
function off(target, evt, fn){
	if (!target) return target;

	var callbacks, i;

	//unbind all listeners if no fn specified
	if (fn === undefined) {
		var args = slice(arguments, 1);

		//try to use target removeAll method, if any
		var allOff = target['removeAll'] || target['removeAllListeners'];

		//call target removeAll
		if (allOff) {
			allOff.apply(target, args);
		}


		//then forget own callbacks, if any

		//unbind all evts
		if (!evt) {
			callbacks = listeners(target);
			for (evt in callbacks) {
				off(target, evt);
			}
		}
		//unbind all callbacks for an evt
		else {
			//invoke method for each space-separated event from a list
			evt.split(/\s+/).forEach(function(evt){
				var evtParts = evt.split('.');
				evt = evtParts.shift();

				callbacks = listeners(target, evt, evtParts);
				for (var i = callbacks.length; i--;){
					off(target, evt, callbacks[i]);
				}
			});
		}

		return target;
	}


	//target events (string notation to advanced_optimizations)
	var offMethod = target['off'] || target['removeEventListener'] || target['removeListener'] || target['detachEvent'];

	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function(evt){
		var evtParts = evt.split('.');
		evt = evtParts.shift();

		//use target `off`, if possible
		if (offMethod) {
			//avoid self-recursion from the outside
			if (icicle.freeze(target, 'off' + evt)){
				offMethod.call(target, evt, fn);
				icicle.unfreeze(target, 'off' + evt);
			}

			//if it’s frozen - ignore call
			else {
				return target;
			}
		}

		//forget callback
		listeners.remove(target, evt, fn, evtParts);
	});


	return target;
}
},{"./listeners":12,"icicle":14,"sliced":22}],26:[function(require,module,exports){
/**
 * @module emmy/on
 */


var icicle = require('icicle');
var listeners = require('./listeners');


module.exports = on;


/**
 * Bind fn to a target.
 *
 * @param {*} targte A single target to bind evt
 * @param {string} evt An event name
 * @param {Function} fn A callback
 * @param {Function}? condition An optional filtering fn for a callback
 *                              which accepts an event and returns callback
 *
 * @return {object} A target
 */
function on(target, evt, fn){
	if (!target) return target;

	//get target `on` method, if any
	var onMethod = target['on'] || target['addEventListener'] || target['addListener'] || target['attachEvent'];

	var cb = fn;

	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function(evt){
		var evtParts = evt.split('.');
		evt = evtParts.shift();

		//use target event system, if possible
		if (onMethod) {
			//avoid self-recursions
			//if it’s frozen - ignore call
			if (icicle.freeze(target, 'on' + evt)){
				onMethod.call(target, evt, cb);
				icicle.unfreeze(target, 'on' + evt);
			}
			else {
				return target;
			}
		}

		//save the callback anyway
		listeners.add(target, evt, cb, evtParts);
	});

	return target;
}


/**
 * Wrap an fn with condition passing
 */
on.wrap = function(target, evt, fn, condition){
	var cb = function() {
		if (condition.apply(target, arguments)) {
			return fn.apply(target, arguments);
		}
	};

	cb.fn = fn;

	return cb;
};
},{"./listeners":12,"icicle":14}],27:[function(require,module,exports){
/**
 * @module emmy/once
 */
module.exports = once;

var icicle = require('icicle');
var on = require('./on');
var off = require('./off');


/**
 * Add an event listener that will be invoked once and then removed.
 *
 * @return {target}
 */
function once(target, evt, fn){
	if (!target) return;

	//get target once method, if any
	var onceMethod = target['once'] || target['one'] || target['addOnceEventListener'] || target['addOnceListener'], cb;


	//use own events
	//wrap callback to once-call
	cb = once.wrap(target, evt, fn, off);


	//invoke method for each space-separated event from a list
	evt.split(/\s+/).forEach(function(evt){
		//use target event system, if possible
		if (onceMethod) {
			//avoid self-recursions
			if (icicle.freeze(target, 'one' + evt)){
				var res = onceMethod.call(target, evt, fn);

				//FIXME: save callback, just in case of removeListener
				// listeners.add(target, evt, fn);
				icicle.unfreeze(target, 'one' + evt);

				return res;
			}

			//if still called itself second time - do default routine
		}

		//bind wrapper default way - in case of own emit method
		on(target, evt, cb);
	});

	return cb;
}


/** Return once wrapper, with optional special off passed */
once.wrap = function (target, evt, fn, off) {
	var cb = function() {
		off(target, evt, cb);
		fn.apply(target, arguments);
	};

	cb.fn = fn;

	return cb;
};
},{"./off":25,"./on":26,"icicle":14}],28:[function(require,module,exports){
/**
 * Throttle function call.
 *
 * @module emmy/throttle
 */


module.exports = throttle;

var on = require('./on');
var off = require('./off');
var isFn = require('mutype/is-fn');



/**
 * Throttles call by rebinding event each N seconds
 *
 * @param {Object} target Any object to throttle
 * @param {string} evt An event name
 * @param {Function} fn A callback
 * @param {int} interval A minimum interval between calls
 *
 * @return {Function} A wrapped callback
 */
function throttle(target, evt, fn, interval){
	//FIXME: find cases where objects has own throttle method, then use target’s throttle

	//bind wrapper
	return on(target, evt, throttle.wrap(target, evt, fn, interval));
}


/** Return wrapped with interval fn */
throttle.wrap = function(target, evt, fn, interval){
	//swap params, if needed
	if (isFn(interval)) {
		var tmp = interval;
		interval = fn;
		fn = tmp;
	}

	//wrap callback
	var cb = function() {
		//do call
		fn.apply(target, arguments);

		//ignore calls
		off(target, evt, cb);

		//till the interval is passed
		setTimeout(function(){
			on(target, evt, cb);
		}, interval);
	};

	cb.fn = fn;

	return cb;
};
},{"./off":25,"./on":26,"mutype/is-fn":19}],29:[function(require,module,exports){
/**
 * @module esdom/analyze
 */


var q = require('query-relative');
var closest = q.closest;
var matches = require('queried/lib/pseudos/matches');
var find = require('array-find');


/**
 * Add attributes to nodes helpful to analyze stuff
 *
 */
function analyze(el){
	var scopeCounter = 0;

	analyzeScopes(el, {scopeCounter:0, lastScope: null});

	//mark variables
	analyzeDeclarations(el);

	//mark references
	analyzeReferences(el);
}


/**
 * Scopes analyzer for the DOM structure - marks nodes with helpful attributes:
 * `data-scope=<id>` - scope id
 * `data-scope-global` - global scope flag
 * `data-scope-parent=<id>` - parent scope id
 * `data-scope-variables=<count>` - number of variables in scope
 */
function analyzeScopes(el, opts){
	if (matches(el, '.Function, .CatchClause, .Program')) {
		el.setAttribute('data-scope', opts.scopeCounter++);

		//save parent scope
		var parentScope = closest(el, '[data-scope]');
		if (parentScope) {
			el.setAttribute('data-scope-parent', parentScope.getAttribute('data-scope'));
		}

		//mark global
		if (matches(el, 'Program')) el.setAttribute('data-scope-global', '');

		opts.lastScope = el;
	}

	//for each kid mark scope
	q.all('> *', el).forEach(function(el){
		analyzeScopes(el, opts);
	});
}




/**
 * Mark all declarations within the scope
 * `data-variable=<id>` - variable indicator with unique id
 * `data-variable-declaration` - variable declaration flag (implicit doesn’t have)
 * `data-variable-scope=<scope-id>` - variable scope
 *
 * Vars can be declared via:
 * - VariableDeclarator
 * - Function `arguments`, arguments, rest
 * - FunctionDeclaration
 * - CatchClause param
 * - ClassName
 * - ImportBinding
 * - Implicit variables
 */
function analyzeDeclarations(scope){
	if (scope.hasAttribute('data-scope')) {
		var scopeId = scope.getAttribute('data-scope');

		// console.group(scopeId)

		//catch scope arguments
		var args = q.all('> .Identifier[prop*="param"]', scope);

		//mark function/catchclause params
		args.forEach(function(node){
			markDeclaration(node, scope);
		});

		//get list of scope ids
		var ids = q.all('.Identifier', scope)
		.filter(function(el){
			if (args.indexOf(el) >= 0) return false;
			return closest(el, '[data-scope]') === scope;
		});

		ids.forEach(function(id){
			//if identifier is a variable declarator - mark it
			if (matches(id.parentNode, '.VariableDeclarator')) {
				markDeclaration(id, scope);
			}

			//if identifier is a function declaration (hoisting) - mark it as belonging to parent scope
			if (matches(id.parentNode, '.FunctionDeclaration')){
				if (matches(id, ':first-child')) {
					markDeclaration(id, closest(scope, '[data-scope]'));
				}
				else {
					markDeclaration(id, scope);
				}
			}
		});

		// console.groupEnd();
	}


	/**
	 * Mark node as a variable within scope
	 */
	function markDeclaration(node, scope){
		var scopeId = scope.getAttribute('data-scope');
		var scopeVarCounter = +scope.getAttribute('data-scope-variables') || matches(scope, '.Function') ? 1 : 0;

		node.setAttribute('data-variable', scopeId + '' + (scopeVarCounter++));
		node.setAttribute('data-variable-scope', scopeId);
		node.setAttribute('data-variable-declaration', '');

		scope.setAttribute('data-scope-variables', scopeVarCounter);
	}


	//analyze nested els
	q.all('> *', scope).forEach(analyzeDeclarations);
}


/**
 * Go by all identifiers, mark their scopes & declarations
 *
 * Non-variable identifiers are:
 * - memberexpression
 * - object keys
 * - labeledstatement label
 * - breakstatement label
 * - continuestatement label
 */
function analyzeReferences(el){
	//ordered scopes, by depth
	var scopes = [], children = [el];

	//calc scopes depth, go from bottom to top
	while (children.length) {
		scopes = scopes.concat(children.filter(function(el){return matches(el, '[data-scope]')}));
		children = q.all('> *', children);
	}

	//go from lower scopes to upper, mark variables
	scopes.reverse().forEach(function(scope){
		analyzeScopeRefs(scope);
	});


	function analyzeScopeRefs(scope){
		var scopeId = scope.getAttribute('data-scope');

		//get list of declarations for the scope
		var sel = '[data-variable-declaration][data-variable-scope="' + scopeId + '"]';
		var declarations = q.all(sel, el);

		//get all nested identifiers
		var ids = q.all('.Identifier', scope).filter(function(id){
			//ignore plain properties refs
			if (matches(id, '[prop="property"]') && id.parentNode.getAttribute('computed') === 'false') return false;

			//ignore object keys definitions
			if (matches(id, '[prop="key"]')) return false;

			//ignore already marked variables
			if (id.hasAttribute('data-variable')) return false;

			//otherwise id is a variable reference
			return true;
		});

		//mark each valid id having declaration within that scope
		ids.forEach(function(id){
			var idName = id.getAttribute('name');

			var decl = find(declarations, function(decl){
				return decl.getAttribute('name') === idName;
			});

			//if decl found - variable is of that scope
			if (decl) {
				id.setAttribute('data-variable', decl.getAttribute('data-variable'));
				id.setAttribute('data-variable-scope', decl.getAttribute('data-variable-scope'));
			}

			//if name is arguments and scope is fn - it belongs to the scope
			else if (idName === 'arguments' && matches(scope, '.Function')){
				id.setAttribute('data-variable', scopeId + '' + 0);
				id.setAttribute('data-variable-scope', scopeId);
			}
		});
	}
}


module.exports = analyze;
},{"array-find":31,"queried/lib/pseudos/matches":71,"query-relative":87}],30:[function(require,module,exports){
/**
 * @module  esdom
 */

var assert = require('assert');
var types = require('ast-types');
var isPlainObject = require('is-plain-object');
var isArray = require('is-array');
var slice = require('sliced');
var parseAttr = require('parse-attr').typeBased;
var stringifyAttr = require('parse-attr').stringify;
var doc = require('get-doc') || require('dom-lite').document;


//TODO: add validation
//TODO: use builders instead of manual creation
//TODO: make block statement a scope, not the function (possibly related to cycle scopes)
//TODO: register proper web-components with getters on props
//TODO: acquire on-component toAST method, returning AST subtree
//TODO: acquire on-component toCode methods, returning source code
//TODO: mark/analyze scopes
//TODO: online demo: source, visualize, analyze btn



/**
 * Domify AST compliant with esquery as much as possible
 *
 * @param {Object} ast Target AST to serialize
 *
 * @return {HTMLElement} Resulting HTML subtree
 */
function toDOM(ast){
	var el;

	assert(ast.type, 'Node type should be defined');
	assert(types.namedTypes[ast.type], 'Bad AST type ' + ast.type);

	// console.log(types.namedTypes[ast.type])

	//create element
	el = doc.createElement(ast.type);

	//append proper classes
	el.className = ast.type;
	var superTypes = types.getSupertypeNames(ast.type);
	superTypes.forEach(function(type){
		el.className += ' ' + type;
	});

	//take over all attributes
	// types.eachField(ast, function(attr, value){
	var value;
	for (var attr in ast) {
		value = ast[attr];

		if (ignoreAttr[attr]) continue;

		//for arrays - append inner elements
		if (isArray(value)) {
			value.forEach(function(item){
				var subEl = toDOM(item);
				subEl.setAttribute('prop', attr);
				// defineAttrGetter(subEl, 'prop');

				el.appendChild(subEl);
			});

			//preset selector attribute (fetch items from children)
			el.setAttribute(attr, '[]');

			//add prop list getter
			//FIXME: move to web-components
			// Object.defineProperty(el, attr, {
			// 	get: (function(selector){
			// 		return function(){
			// 			return this.parentNode.querySelectorAll(this.type + '>' + selector);
			// 		};
			// 	})('[prop=' + value.type + ']')
			// });
		}
		//for objects - just create inner element and set attr reference to it
		else if (isPlainObject(value)) {
			var child = toDOM(value);
			el.appendChild(child);
			el.setAttribute(attr, value.type);
			// defineAttrGetter(el, attr);

			child.setAttribute('prop', attr);

			//add inner object getter by the prop
			//FIXME: move to web-components
			// Object.defineProperty(el, attr, {
			// 	get: (function(selector){
			// 		return function(){
			// 			//FIXME: enhance this selector (may fail to work)
			// 			return this.querySelector(selector);
			// 		};
			// 	})(value.type)
			// });
		}
		//otherwise simply stringify
		else {
			el.setAttribute(attr, stringifyAttr(value));
			// defineAttrGetter(el, attr);
		}
	};

	return el;
}



/**
 * Parse AST from DOM element
 *
 * @param {HTMLElement} el Root element
 *
 * @return {Object} AST tree
 */
function toAST(el){
	var ast = {};
	var type = el.getAttribute('type');
	var children = slice(el.childNodes);

	//take over attributes
	var attributes = el.attributes, name, value, _name;

	for (var i = 0; i < attributes.length; i++){
		name = camelNames[attributes[i].name] || attributes[i].name;

		if (ignoreAttr[name]) continue;
		if (/^data-|^_/.test(name)) continue;

		//transform value from raw
		if (name === 'value' && el.getAttribute('raw')) {
			//FIXME: this might be an unsafe place
			value = eval(el.getAttribute('raw'));
		}
		//don’t parse raws
		else if (name === 'raw' || name === 'name'){
			value = attributes[i].value;
		}
		//just parse
		else {
			value = parseAttr(attributes[i].value);
		}


		ast[name] = value;
	}

	//for each kid - place it respectively to parent
	children.forEach(function (child) {
		if (child.nodeType !== 1) return;

		var parentProp = child.getAttribute('prop');
		if (el.getAttribute(parentProp) === '[]') {
			(isArray(ast[parentProp]) ? ast[parentProp] : (ast[parentProp] = [])).push(toAST(child));
		}
		else {
			ast[parentProp] = toAST(child);
		}
	});

	return ast;
}


/** Define attribute getter on element */
function defineAttrGetter(el, attr) {
	Object.defineProperty(el, attr, {
		get: function(){
			return this.getAttribute(attr);
		}
	});
}



/** List of attributes to ignore */
//FIXME: remove this when builder params get available
var ignoreAttr = {
	class: true,
	prop: true,
	loc: true,
	original: true
};


/** Dist of lc → cc prop names */
//FIXME: collect all the camelcase names
var camelNames = {
	guardedhandlers: 'guardedHandlers'
};



/** Exports */
module.exports = {
	toDOM: toDOM,
	toAST: toAST,
	analyze: require('./analyze')
};
},{"./analyze":29,"assert":1,"ast-types":45,"dom-lite":46,"get-doc":47,"is-array":49,"is-plain-object":50,"parse-attr":51,"sliced":91}],31:[function(require,module,exports){
function find(array, predicate, self) {
  self = self || this;
  var len = array.length;
  var i;
  if (len === 0) {
    return;
  }
  if (typeof predicate !== 'function') {
    throw new TypeError(predicate + ' must be a function');
  }

  for (i = 0; i < len; i++) {
    if (predicate.call(self, array[i], i, array)) {
      return array[i];
    }
  }

  return;
}

module.exports = find;

},{}],32:[function(require,module,exports){
var types = require("../lib/types");
var Type = types.Type;
var def = Type.def;
var or = Type.or;
var builtin = types.builtInTypes;
var isString = builtin.string;
var isNumber = builtin.number;
var isBoolean = builtin.boolean;
var isRegExp = builtin.RegExp;
var shared = require("../lib/shared");
var defaults = shared.defaults;
var geq = shared.geq;

// Abstract supertype of all syntactic entities that are allowed to have a
// .loc field.
def("Printable")
    .field("loc", or(
        def("SourceLocation"),
        null
    ), defaults["null"], true);

def("Node")
    .bases("Printable")
    .field("type", isString);

def("SourceLocation")
    .build("start", "end", "source")
    .field("start", def("Position"))
    .field("end", def("Position"))
    .field("source", or(isString, null), defaults["null"]);

def("Position")
    .build("line", "column")
    .field("line", geq(1))
    .field("column", geq(0));

def("Program")
    .bases("Node")
    .build("body")
    .field("body", [def("Statement")])
    .field("comments", or(
        [or(def("Block"), def("Line"))],
        null
    ), defaults["null"], true);

def("Function")
    .bases("Node")
    .field("id", or(def("Identifier"), null), defaults["null"])
    .field("params", [def("Pattern")])
    .field("body", or(def("BlockStatement"), def("Expression")));

def("Statement").bases("Node");

// The empty .build() here means that an EmptyStatement can be constructed
// (i.e. it's not abstract) but that it needs no arguments.
def("EmptyStatement").bases("Statement").build();

def("BlockStatement")
    .bases("Statement")
    .build("body")
    .field("body", [def("Statement")]);

// TODO Figure out how to silently coerce Expressions to
// ExpressionStatements where a Statement was expected.
def("ExpressionStatement")
    .bases("Statement")
    .build("expression")
    .field("expression", def("Expression"));

def("IfStatement")
    .bases("Statement")
    .build("test", "consequent", "alternate")
    .field("test", def("Expression"))
    .field("consequent", def("Statement"))
    .field("alternate", or(def("Statement"), null), defaults["null"]);

def("LabeledStatement")
    .bases("Statement")
    .build("label", "body")
    .field("label", def("Identifier"))
    .field("body", def("Statement"));

def("BreakStatement")
    .bases("Statement")
    .build("label")
    .field("label", or(def("Identifier"), null), defaults["null"]);

def("ContinueStatement")
    .bases("Statement")
    .build("label")
    .field("label", or(def("Identifier"), null), defaults["null"]);

def("WithStatement")
    .bases("Statement")
    .build("object", "body")
    .field("object", def("Expression"))
    .field("body", def("Statement"));

def("SwitchStatement")
    .bases("Statement")
    .build("discriminant", "cases", "lexical")
    .field("discriminant", def("Expression"))
    .field("cases", [def("SwitchCase")])
    .field("lexical", isBoolean, defaults["false"]);

def("ReturnStatement")
    .bases("Statement")
    .build("argument")
    .field("argument", or(def("Expression"), null));

def("ThrowStatement")
    .bases("Statement")
    .build("argument")
    .field("argument", def("Expression"));

def("TryStatement")
    .bases("Statement")
    .build("block", "handler", "finalizer")
    .field("block", def("BlockStatement"))
    .field("handler", or(def("CatchClause"), null), function() {
        return this.handlers && this.handlers[0] || null;
    })
    .field("handlers", [def("CatchClause")], function() {
        return this.handler ? [this.handler] : [];
    }, true) // Indicates this field is hidden from eachField iteration.
    .field("guardedHandlers", [def("CatchClause")], defaults.emptyArray)
    .field("finalizer", or(def("BlockStatement"), null), defaults["null"]);

def("CatchClause")
    .bases("Node")
    .build("param", "guard", "body")
    .field("param", def("Pattern"))
    .field("guard", or(def("Expression"), null), defaults["null"])
    .field("body", def("BlockStatement"));

def("WhileStatement")
    .bases("Statement")
    .build("test", "body")
    .field("test", def("Expression"))
    .field("body", def("Statement"));

def("DoWhileStatement")
    .bases("Statement")
    .build("body", "test")
    .field("body", def("Statement"))
    .field("test", def("Expression"));

def("ForStatement")
    .bases("Statement")
    .build("init", "test", "update", "body")
    .field("init", or(
        def("VariableDeclaration"),
        def("Expression"),
        null))
    .field("test", or(def("Expression"), null))
    .field("update", or(def("Expression"), null))
    .field("body", def("Statement"));

def("ForInStatement")
    .bases("Statement")
    .build("left", "right", "body", "each")
    .field("left", or(
        def("VariableDeclaration"),
        def("Expression")))
    .field("right", def("Expression"))
    .field("body", def("Statement"))
    .field("each", isBoolean);

def("DebuggerStatement").bases("Statement").build();

def("Declaration").bases("Statement");

def("FunctionDeclaration")
    .bases("Function", "Declaration")
    .build("id", "params", "body")
    .field("id", def("Identifier"));

def("FunctionExpression")
    .bases("Function", "Expression")
    .build("id", "params", "body");

def("VariableDeclaration")
    .bases("Declaration")
    .build("kind", "declarations")
    .field("kind", or("var", "let", "const"))
    .field("declarations", [or(
        def("VariableDeclarator"),
        def("Identifier") // TODO Esprima deviation.
    )]);

def("VariableDeclarator")
    .bases("Node")
    .build("id", "init")
    .field("id", def("Pattern"))
    .field("init", or(def("Expression"), null));

// TODO Are all Expressions really Patterns?
def("Expression").bases("Node", "Pattern");

def("ThisExpression").bases("Expression").build();

def("ArrayExpression")
    .bases("Expression")
    .build("elements")
    .field("elements", [or(def("Expression"), null)]);

def("ObjectExpression")
    .bases("Expression")
    .build("properties")
    .field("properties", [def("Property")]);

// TODO Not in the Mozilla Parser API, but used by Esprima.
def("Property")
    .bases("Node") // Want to be able to visit Property Nodes.
    .build("kind", "key", "value")
    .field("kind", or("init", "get", "set"))
    .field("key", or(def("Literal"), def("Identifier")))
    .field("value", def("Expression"));

def("SequenceExpression")
    .bases("Expression")
    .build("expressions")
    .field("expressions", [def("Expression")]);

var UnaryOperator = or(
    "-", "+", "!", "~",
    "typeof", "void", "delete");

def("UnaryExpression")
    .bases("Expression")
    .build("operator", "argument", "prefix")
    .field("operator", UnaryOperator)
    .field("argument", def("Expression"))
    // TODO Esprima doesn't bother with this field, presumably because
    // it's always true for unary operators.
    .field("prefix", isBoolean, defaults["true"]);

var BinaryOperator = or(
    "==", "!=", "===", "!==",
    "<", "<=", ">", ">=",
    "<<", ">>", ">>>",
    "+", "-", "*", "/", "%",
    "&", // TODO Missing from the Parser API.
    "|", "^", "in",
    "instanceof", "..");

def("BinaryExpression")
    .bases("Expression")
    .build("operator", "left", "right")
    .field("operator", BinaryOperator)
    .field("left", def("Expression"))
    .field("right", def("Expression"));

var AssignmentOperator = or(
    "=", "+=", "-=", "*=", "/=", "%=",
    "<<=", ">>=", ">>>=",
    "|=", "^=", "&=");

def("AssignmentExpression")
    .bases("Expression")
    .build("operator", "left", "right")
    .field("operator", AssignmentOperator)
    .field("left", def("Pattern"))
    .field("right", def("Expression"));

var UpdateOperator = or("++", "--");

def("UpdateExpression")
    .bases("Expression")
    .build("operator", "argument", "prefix")
    .field("operator", UpdateOperator)
    .field("argument", def("Expression"))
    .field("prefix", isBoolean);

var LogicalOperator = or("||", "&&");

def("LogicalExpression")
    .bases("Expression")
    .build("operator", "left", "right")
    .field("operator", LogicalOperator)
    .field("left", def("Expression"))
    .field("right", def("Expression"));

def("ConditionalExpression")
    .bases("Expression")
    .build("test", "consequent", "alternate")
    .field("test", def("Expression"))
    .field("consequent", def("Expression"))
    .field("alternate", def("Expression"));

def("NewExpression")
    .bases("Expression")
    .build("callee", "arguments")
    .field("callee", def("Expression"))
    // The Mozilla Parser API gives this type as [or(def("Expression"),
    // null)], but null values don't really make sense at the call site.
    // TODO Report this nonsense.
    .field("arguments", [def("Expression")]);

def("CallExpression")
    .bases("Expression")
    .build("callee", "arguments")
    .field("callee", def("Expression"))
    // See comment for NewExpression above.
    .field("arguments", [def("Expression")]);

def("MemberExpression")
    .bases("Expression")
    .build("object", "property", "computed")
    .field("object", def("Expression"))
    .field("property", or(def("Identifier"), def("Expression")))
    .field("computed", isBoolean);

def("Pattern").bases("Node");

def("ObjectPattern")
    .bases("Pattern")
    .build("properties")
    // TODO File a bug to get PropertyPattern added to the interfaces API.
    .field("properties", [def("PropertyPattern")]);

def("PropertyPattern")
    .bases("Pattern")
    .build("key", "pattern")
    .field("key", or(def("Literal"), def("Identifier")))
    .field("pattern", def("Pattern"));

def("ArrayPattern")
    .bases("Pattern")
    .build("elements")
    .field("elements", [or(def("Pattern"), null)]);

def("SwitchCase")
    .bases("Node")
    .build("test", "consequent")
    .field("test", or(def("Expression"), null))
    .field("consequent", [def("Statement")]);

def("Identifier")
    // But aren't Expressions and Patterns already Nodes? TODO Report this.
    .bases("Node", "Expression", "Pattern")
    .build("name")
    .field("name", isString);

def("Literal")
    // But aren't Expressions already Nodes? TODO Report this.
    .bases("Node", "Expression")
    .build("value")
    .field("value", or(
        isString,
        isBoolean,
        null, // isNull would also work here.
        isNumber,
        isRegExp
    ));

// Block comment. Not a Node.
def("Block")
    .bases("Printable")
    .build("loc", "value")
    .field("value", isString);

// Single line comment. Not a Node.
def("Line")
    .bases("Printable")
    .build("loc", "value")
    .field("value", isString);

},{"../lib/shared":43,"../lib/types":44}],33:[function(require,module,exports){
require("./core");
var types = require("../lib/types");
var def = types.Type.def;
var or = types.Type.or;
var builtin = types.builtInTypes;
var isString = builtin.string;
var isBoolean = builtin.boolean;

// Note that none of these types are buildable because the Mozilla Parser
// API doesn't specify any builder functions, and nobody uses E4X anymore.

def("XMLDefaultDeclaration")
    .bases("Declaration")
    .field("namespace", def("Expression"));

def("XMLAnyName").bases("Expression");

def("XMLQualifiedIdentifier")
    .bases("Expression")
    .field("left", or(def("Identifier"), def("XMLAnyName")))
    .field("right", or(def("Identifier"), def("Expression")))
    .field("computed", isBoolean);

def("XMLFunctionQualifiedIdentifier")
    .bases("Expression")
    .field("right", or(def("Identifier"), def("Expression")))
    .field("computed", isBoolean);

def("XMLAttributeSelector")
    .bases("Expression")
    .field("attribute", def("Expression"));

def("XMLFilterExpression")
    .bases("Expression")
    .field("left", def("Expression"))
    .field("right", def("Expression"));

def("XMLElement")
    .bases("XML", "Expression")
    .field("contents", [def("XML")]);

def("XMLList")
    .bases("XML", "Expression")
    .field("contents", [def("XML")]);

def("XML").bases("Node");

def("XMLEscape")
    .bases("XML")
    .field("expression", def("Expression"));

def("XMLText")
    .bases("XML")
    .field("text", isString);

def("XMLStartTag")
    .bases("XML")
    .field("contents", [def("XML")]);

def("XMLEndTag")
    .bases("XML")
    .field("contents", [def("XML")]);

def("XMLPointTag")
    .bases("XML")
    .field("contents", [def("XML")]);

def("XMLName")
    .bases("XML")
    .field("contents", or(isString, [def("XML")]));

def("XMLAttribute")
    .bases("XML")
    .field("value", isString);

def("XMLCdata")
    .bases("XML")
    .field("contents", isString);

def("XMLComment")
    .bases("XML")
    .field("contents", isString);

def("XMLProcessingInstruction")
    .bases("XML")
    .field("target", isString)
    .field("contents", or(isString, null));

},{"../lib/types":44,"./core":32}],34:[function(require,module,exports){
require("./core");
var types = require("../lib/types");
var def = types.Type.def;
var or = types.Type.or;
var builtin = types.builtInTypes;
var isBoolean = builtin.boolean;
var isObject = builtin.object;
var isString = builtin.string;
var defaults = require("../lib/shared").defaults;

def("Function")
    .field("generator", isBoolean, defaults["false"])
    .field("expression", isBoolean, defaults["false"])
    .field("defaults", [or(def("Expression"), null)], defaults.emptyArray)
    // TODO This could be represented as a SpreadElementPattern in .params.
    .field("rest", or(def("Identifier"), null), defaults["null"]);

def("FunctionDeclaration")
    .build("id", "params", "body", "generator", "expression");

def("FunctionExpression")
    .build("id", "params", "body", "generator", "expression");

// TODO The Parser API calls this ArrowExpression, but Esprima uses
// ArrowFunctionExpression.
def("ArrowFunctionExpression")
    .bases("Function", "Expression")
    .build("params", "body", "expression")
    // The forced null value here is compatible with the overridden
    // definition of the "id" field in the Function interface.
    .field("id", null, defaults["null"])
    // The current spec forbids arrow generators, so I have taken the
    // liberty of enforcing that. TODO Report this.
    .field("generator", false);

def("YieldExpression")
    .bases("Expression")
    .build("argument", "delegate")
    .field("argument", or(def("Expression"), null))
    .field("delegate", isBoolean, defaults["false"]);

def("GeneratorExpression")
    .bases("Expression")
    .build("body", "blocks", "filter")
    .field("body", def("Expression"))
    .field("blocks", [def("ComprehensionBlock")])
    .field("filter", or(def("Expression"), null));

def("ComprehensionExpression")
    .bases("Expression")
    .build("body", "blocks", "filter")
    .field("body", def("Expression"))
    .field("blocks", [def("ComprehensionBlock")])
    .field("filter", or(def("Expression"), null));

def("ComprehensionBlock")
    .bases("Node")
    .build("left", "right", "each")
    .field("left", def("Pattern"))
    .field("right", def("Expression"))
    .field("each", isBoolean);

def("ModuleSpecifier")
    .bases("Literal")
    .build("value")
    .field("value", isString);

def("Property")
    // Esprima extensions not mentioned in the Mozilla Parser API:
    .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
    .field("method", isBoolean, defaults["false"])
    .field("shorthand", isBoolean, defaults["false"])
    .field("computed", isBoolean, defaults["false"]);

def("PropertyPattern")
    .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
    .field("computed", isBoolean, defaults["false"]);

def("MethodDefinition")
    .bases("Declaration")
    .build("kind", "key", "value")
    .field("kind", or("init", "get", "set", ""))
    .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
    .field("value", def("Function"))
    .field("computed", isBoolean, defaults["false"]);

def("SpreadElement")
    .bases("Node")
    .build("argument")
    .field("argument", def("Expression"));

def("ArrayExpression")
    .field("elements", [or(def("Expression"), def("SpreadElement"), null)]);

def("NewExpression")
    .field("arguments", [or(def("Expression"), def("SpreadElement"))]);

def("CallExpression")
    .field("arguments", [or(def("Expression"), def("SpreadElement"))]);

def("SpreadElementPattern")
    .bases("Pattern")
    .build("argument")
    .field("argument", def("Pattern"));

var ClassBodyElement = or(
    def("MethodDefinition"),
    def("VariableDeclarator"),
    def("ClassPropertyDefinition"),
    def("ClassProperty")
);

def("ClassProperty")
  .bases("Declaration")
  .build("key")
  .field("key", or(def("Literal"), def("Identifier"), def("Expression")))
  .field("computed", isBoolean, defaults["false"]);

def("ClassPropertyDefinition") // static property
    .bases("Declaration")
    .build("definition")
    // Yes, Virginia, circular definitions are permitted.
    .field("definition", ClassBodyElement);

def("ClassBody")
    .bases("Declaration")
    .build("body")
    .field("body", [ClassBodyElement]);

def("ClassDeclaration")
    .bases("Declaration")
    .build("id", "body", "superClass")
    .field("id", def("Identifier"))
    .field("body", def("ClassBody"))
    .field("superClass", or(def("Expression"), null), defaults["null"]);

def("ClassExpression")
    .bases("Expression")
    .build("id", "body", "superClass")
    .field("id", or(def("Identifier"), null), defaults["null"])
    .field("body", def("ClassBody"))
    .field("superClass", or(def("Expression"), null), defaults["null"])
    .field("implements", [def("ClassImplements")], defaults.emptyArray);

def("ClassImplements")
    .bases("Node")
    .build("id")
    .field("id", def("Identifier"))
    .field("superClass", or(def("Expression"), null), defaults["null"]);

// Specifier and NamedSpecifier are abstract non-standard types that I
// introduced for definitional convenience.
def("Specifier").bases("Node");
def("NamedSpecifier")
    .bases("Specifier")
    // Note: this abstract type is intentionally not buildable.
    .field("id", def("Identifier"))
    .field("name", or(def("Identifier"), null), defaults["null"]);

// Like NamedSpecifier, except type:"ExportSpecifier" and buildable.
// export {<id [as name]>} [from ...];
def("ExportSpecifier")
    .bases("NamedSpecifier")
    .build("id", "name");

// export <*> from ...;
def("ExportBatchSpecifier")
    .bases("Specifier")
    .build();

// Like NamedSpecifier, except type:"ImportSpecifier" and buildable.
// import {<id [as name]>} from ...;
def("ImportSpecifier")
    .bases("NamedSpecifier")
    .build("id", "name");

// import <* as id> from ...;
def("ImportNamespaceSpecifier")
    .bases("Specifier")
    .build("id")
    .field("id", def("Identifier"));

// import <id> from ...;
def("ImportDefaultSpecifier")
    .bases("Specifier")
    .build("id")
    .field("id", def("Identifier"));

def("ExportDeclaration")
    .bases("Declaration")
    .build("default", "declaration", "specifiers", "source")
    .field("default", isBoolean)
    .field("declaration", or(
        def("Declaration"),
        def("Expression"), // Implies default.
        null
    ))
    .field("specifiers", [or(
        def("ExportSpecifier"),
        def("ExportBatchSpecifier")
    )], defaults.emptyArray)
    .field("source", or(def("ModuleSpecifier"), null), defaults["null"]);

def("ImportDeclaration")
    .bases("Declaration")
    .build("specifiers", "source")
    .field("specifiers", [or(
        def("ImportSpecifier"),
        def("ImportNamespaceSpecifier"),
        def("ImportDefaultSpecifier")
    )], defaults.emptyArray)
    .field("source", def("ModuleSpecifier"));

def("TaggedTemplateExpression")
    .bases("Expression")
    .field("tag", def("Expression"))
    .field("quasi", def("TemplateLiteral"));

def("TemplateLiteral")
    .bases("Expression")
    .build("quasis", "expressions")
    .field("quasis", [def("TemplateElement")])
    .field("expressions", [def("Expression")]);

def("TemplateElement")
    .bases("Node")
    .build("value", "tail")
    .field("value", {"cooked": isString, "raw": isString})
    .field("tail", isBoolean);

},{"../lib/shared":43,"../lib/types":44,"./core":32}],35:[function(require,module,exports){
require("./core");
var types = require("../lib/types");
var def = types.Type.def;
var or = types.Type.or;
var builtin = types.builtInTypes;
var isBoolean = builtin.boolean;
var defaults = require("../lib/shared").defaults;

def("Function")
    .field("async", isBoolean, defaults["false"]);

def("SpreadProperty")
    .bases("Node")
    .build("argument")
    .field("argument", def("Expression"));

def("ObjectExpression")
    .field("properties", [or(def("Property"), def("SpreadProperty"))]);

def("SpreadPropertyPattern")
    .bases("Pattern")
    .build("argument")
    .field("argument", def("Pattern"));

def("ObjectPattern")
    .field("properties", [or(
        def("PropertyPattern"),
        def("SpreadPropertyPattern")
    )]);

def("AwaitExpression")
    .bases("Expression")
    .build("argument", "all")
    .field("argument", or(def("Expression"), null))
    .field("all", isBoolean, defaults["false"]);

},{"../lib/shared":43,"../lib/types":44,"./core":32}],36:[function(require,module,exports){
require("./core");
var types = require("../lib/types");
var def = types.Type.def;
var or = types.Type.or;
var builtin = types.builtInTypes;
var isString = builtin.string;
var isBoolean = builtin.boolean;
var defaults = require("../lib/shared").defaults;

def("XJSAttribute")
    .bases("Node")
    .build("name", "value")
    .field("name", or(def("XJSIdentifier"), def("XJSNamespacedName")))
    .field("value", or(
        def("Literal"), // attr="value"
        def("XJSExpressionContainer"), // attr={value}
        null // attr= or just attr
    ), defaults["null"]);

def("XJSIdentifier")
    .bases("Node")
    .build("name")
    .field("name", isString);

def("XJSNamespacedName")
    .bases("Node")
    .build("namespace", "name")
    .field("namespace", def("XJSIdentifier"))
    .field("name", def("XJSIdentifier"));

def("XJSMemberExpression")
    .bases("MemberExpression")
    .build("object", "property")
    .field("object", or(def("XJSIdentifier"), def("XJSMemberExpression")))
    .field("property", def("XJSIdentifier"))
    .field("computed", isBoolean, defaults.false);

var XJSElementName = or(
    def("XJSIdentifier"),
    def("XJSNamespacedName"),
    def("XJSMemberExpression")
);

def("XJSSpreadAttribute")
    .bases("Node")
    .build("argument")
    .field("argument", def("Expression"));

var XJSAttributes = [or(
    def("XJSAttribute"),
    def("XJSSpreadAttribute")
)];

def("XJSExpressionContainer")
    .bases("Expression")
    .build("expression")
    .field("expression", def("Expression"));

def("XJSElement")
    .bases("Expression")
    .build("openingElement", "closingElement", "children")
    .field("openingElement", def("XJSOpeningElement"))
    .field("closingElement", or(def("XJSClosingElement"), null), defaults["null"])
    .field("children", [or(
        def("XJSElement"),
        def("XJSExpressionContainer"),
        def("XJSText"),
        def("Literal") // TODO Esprima should return XJSText instead.
    )], defaults.emptyArray)
    .field("name", XJSElementName, function() {
        // Little-known fact: the `this` object inside a default function
        // is none other than the partially-built object itself, and any
        // fields initialized directly from builder function arguments
        // (like openingElement, closingElement, and children) are
        // guaranteed to be available.
        return this.openingElement.name;
    })
    .field("selfClosing", isBoolean, function() {
        return this.openingElement.selfClosing;
    })
    .field("attributes", XJSAttributes, function() {
        return this.openingElement.attributes;
    });

def("XJSOpeningElement")
    .bases("Node") // TODO Does this make sense? Can't really be an XJSElement.
    .build("name", "attributes", "selfClosing")
    .field("name", XJSElementName)
    .field("attributes", XJSAttributes, defaults.emptyArray)
    .field("selfClosing", isBoolean, defaults["false"]);

def("XJSClosingElement")
    .bases("Node") // TODO Same concern.
    .build("name")
    .field("name", XJSElementName);

def("XJSText")
    .bases("Literal")
    .build("value")
    .field("value", isString);

def("XJSEmptyExpression").bases("Expression").build();

// Type Annotations
def("Type")
  .bases("Node");

def("AnyTypeAnnotation")
  .bases("Type");

def("VoidTypeAnnotation")
  .bases("Type");

def("NumberTypeAnnotation")
  .bases("Type");

def("StringTypeAnnotation")
  .bases("Type");

def("StringLiteralTypeAnnotation")
  .bases("Type")
  .build("value", "raw")
  .field("value", isString)
  .field("raw", isString);

def("BooleanTypeAnnotation")
  .bases("Type");

def("TypeAnnotation")
  .bases("Node")
  .build("typeAnnotation")
  .field("typeAnnotation", def("Type"));

def("NullableTypeAnnotation")
  .bases("Type")
  .build("typeAnnotation")
  .field("typeAnnotation", def("Type"));

def("FunctionTypeAnnotation")
  .bases("Type")
  .build("params", "returnType", "rest", "typeParameters")
  .field("params", [def("FunctionTypeParam")])
  .field("returnType", def("Type"))
  .field("rest", or(def("FunctionTypeParam"), null))
  .field("typeParameters", or(def("TypeParameterDeclaration"), null));

def("FunctionTypeParam")
  .bases("Node")
  .build("name", "typeAnnotation", "optional")
  .field("name", def("Identifier"))
  .field("typeAnnotation", def("Type"))
  .field("optional", isBoolean);
  
def("ArrayTypeAnnotation")
  .bases("Type")
  .build("elementType")
  .field("elementType", def("Type"));

def("ObjectTypeAnnotation")
  .bases("Type")
  .build("properties")
  .field("properties", [def("ObjectTypeProperty")])
  .field("indexers", [def("ObjectTypeIndexer")], defaults.emptyArray)
  .field("callProperties", [def("ObjectTypeCallProperty")], defaults.emptyArray);

def("ObjectTypeProperty")
  .bases("Node")
  .build("key", "value", "optional")
  .field("key", or(def("Literal"), def("Identifier")))
  .field("value", def("Type"))
  .field("optional", isBoolean);

def("ObjectTypeIndexer")
  .bases("Node")
  .build("id", "key", "value")
  .field("id", def("Identifier"))
  .field("key", def("Type"))
  .field("value", def("Type"));

def("ObjectTypeCallProperty")
  .bases("Node")
  .build("value")
  .field("value", def("FunctionTypeAnnotation"))
  .field("static", isBoolean, false);

def("QualifiedTypeIdentifier")
  .bases("Node")
  .build("qualification", "id")
  .field("qualification", or(def("Identifier"), def("QualifiedTypeIdentifier")))
  .field("id", def("Identifier"));

def("GenericTypeAnnotation")
  .bases("Type")
  .build("id", "typeParameters")
  .field("id", or(def("Identifier"), def("QualifiedTypeIdentifier")))
  .field("typeParameters", or(def("TypeParameterInstantiation"), null));

def("MemberTypeAnnotation")
  .bases("Type")
  .build("object", "property")
  .field("object", def("Identifier"))
  .field("property", or(def("MemberTypeAnnotation"), def("GenericTypeAnnotation")));

def("UnionTypeAnnotation")
  .bases("Type")
  .build("types")
  .field("types", [def("Type")]);

def("IntersectionTypeAnnotation")
  .bases("Type")
  .build("types")
  .field("types", [def("Type")]);

def("TypeofTypeAnnotation")
  .bases("Type")
  .build("argument")
  .field("argument", def("Type"));

def("Identifier")
  .field("typeAnnotation", or(def("TypeAnnotation"), null), defaults["null"]);

def("TypeParameterDeclaration")
  .bases("Node")
  .build("params")
  .field("params", [def("Identifier")]);

def("TypeParameterInstantiation")
  .bases("Node")
  .build("params")
  .field("params", [def("Type")]);

def("Function")
  .field("returnType", or(def("TypeAnnotation"), null), defaults["null"])
  .field("typeParameters", or(def("TypeParameterDeclaration"), null), defaults["null"]);

def("ClassProperty")
  .build("key", "typeAnnotation")
  .field("typeAnnotation", def("TypeAnnotation"))
  .field("static", isBoolean, false);

def("ClassImplements")
  .field("typeParameters", or(def("TypeParameterInstantiation"), null), defaults["null"]);

def("InterfaceDeclaration")
  .bases("Statement")
  .build("id", "body", "extends")
  .field("id", def("Identifier"))
  .field("typeParameters", or(def("TypeParameterDeclaration"), null), defaults["null"])
  .field("body", def("ObjectTypeAnnotation"))
  .field("extends", [def("InterfaceExtends")]);

def("InterfaceExtends")
  .bases("Node")
  .build("id")
  .field("id", def("Identifier"))
  .field("typeParameters", or(def("TypeParameterInstantiation"), null));

def("TypeAlias")
  .bases("Statement")
  .build("id", "typeParameters", "right")
  .field("id", def("Identifier"))
  .field("typeParameters", or(def("TypeParameterDeclaration"), null))
  .field("right", def("Type"));

def("TupleTypeAnnotation")
  .bases("Type")
  .build("types")
  .field("types", [def("Type")]);

def("DeclareVariable")
  .bases("Statement")
  .build("id")
  .field("id", def("Identifier"));

def("DeclareFunction")
  .bases("Statement")
  .build("id")
  .field("id", def("Identifier"));

def("DeclareClass")
  .bases("InterfaceDeclaration")
  .build("id");

def("DeclareModule")
  .bases("Statement")
  .build("id", "body")
  .field("id", or(def("Identifier"), def("Literal")))
  .field("body", def("BlockStatement"));

},{"../lib/shared":43,"../lib/types":44,"./core":32}],37:[function(require,module,exports){
require("./core");
var types = require("../lib/types");
var def = types.Type.def;
var or = types.Type.or;
var geq = require("../lib/shared").geq;

def("ForOfStatement")
    .bases("Statement")
    .build("left", "right", "body")
    .field("left", or(
        def("VariableDeclaration"),
        def("Expression")))
    .field("right", def("Expression"))
    .field("body", def("Statement"));

def("LetStatement")
    .bases("Statement")
    .build("head", "body")
    // TODO Deviating from the spec by reusing VariableDeclarator here.
    .field("head", [def("VariableDeclarator")])
    .field("body", def("Statement"));

def("LetExpression")
    .bases("Expression")
    .build("head", "body")
    // TODO Deviating from the spec by reusing VariableDeclarator here.
    .field("head", [def("VariableDeclarator")])
    .field("body", def("Expression"));

def("GraphExpression")
    .bases("Expression")
    .build("index", "expression")
    .field("index", geq(0))
    .field("expression", def("Literal"));

def("GraphIndexExpression")
    .bases("Expression")
    .build("index")
    .field("index", geq(0));

},{"../lib/shared":43,"../lib/types":44,"./core":32}],38:[function(require,module,exports){
var assert = require("assert");
var types = require("../main");
var getFieldNames = types.getFieldNames;
var getFieldValue = types.getFieldValue;
var isArray = types.builtInTypes.array;
var isObject = types.builtInTypes.object;
var isDate = types.builtInTypes.Date;
var isRegExp = types.builtInTypes.RegExp;
var hasOwn = Object.prototype.hasOwnProperty;

function astNodesAreEquivalent(a, b, problemPath) {
    if (isArray.check(problemPath)) {
        problemPath.length = 0;
    } else {
        problemPath = null;
    }

    return areEquivalent(a, b, problemPath);
}

astNodesAreEquivalent.assert = function(a, b) {
    var problemPath = [];
    if (!astNodesAreEquivalent(a, b, problemPath)) {
        if (problemPath.length === 0) {
            assert.strictEqual(a, b);
        } else {
            assert.ok(
                false,
                "Nodes differ in the following path: " +
                    problemPath.map(subscriptForProperty).join("")
            );
        }
    }
};

function subscriptForProperty(property) {
    if (/[_$a-z][_$a-z0-9]*/i.test(property)) {
        return "." + property;
    }
    return "[" + JSON.stringify(property) + "]";
}

function areEquivalent(a, b, problemPath) {
    if (a === b) {
        return true;
    }

    if (isArray.check(a)) {
        return arraysAreEquivalent(a, b, problemPath);
    }

    if (isObject.check(a)) {
        return objectsAreEquivalent(a, b, problemPath);
    }

    if (isDate.check(a)) {
        return isDate.check(b) && (+a === +b);
    }

    if (isRegExp.check(a)) {
        return isRegExp.check(b) && (
            a.source === b.source &&
            a.global === b.global &&
            a.multiline === b.multiline &&
            a.ignoreCase === b.ignoreCase
        );
    }

    return a == b;
}

function arraysAreEquivalent(a, b, problemPath) {
    isArray.assert(a);
    var aLength = a.length;

    if (!isArray.check(b) || b.length !== aLength) {
        if (problemPath) {
            problemPath.push("length");
        }
        return false;
    }

    for (var i = 0; i < aLength; ++i) {
        if (problemPath) {
            problemPath.push(i);
        }

        if (i in a !== i in b) {
            return false;
        }

        if (!areEquivalent(a[i], b[i], problemPath)) {
            return false;
        }

        if (problemPath) {
            assert.strictEqual(problemPath.pop(), i);
        }
    }

    return true;
}

function objectsAreEquivalent(a, b, problemPath) {
    isObject.assert(a);
    if (!isObject.check(b)) {
        return false;
    }

    // Fast path for a common property of AST nodes.
    if (a.type !== b.type) {
        if (problemPath) {
            problemPath.push("type");
        }
        return false;
    }

    var aNames = getFieldNames(a);
    var aNameCount = aNames.length;

    var bNames = getFieldNames(b);
    var bNameCount = bNames.length;

    if (aNameCount === bNameCount) {
        for (var i = 0; i < aNameCount; ++i) {
            var name = aNames[i];
            var aChild = getFieldValue(a, name);
            var bChild = getFieldValue(b, name);

            if (problemPath) {
                problemPath.push(name);
            }

            if (!areEquivalent(aChild, bChild, problemPath)) {
                return false;
            }

            if (problemPath) {
                assert.strictEqual(problemPath.pop(), name);
            }
        }

        return true;
    }

    if (!problemPath) {
        return false;
    }

    // Since aNameCount !== bNameCount, we need to find some name that's
    // missing in aNames but present in bNames, or vice-versa.

    var seenNames = Object.create(null);

    for (i = 0; i < aNameCount; ++i) {
        seenNames[aNames[i]] = true;
    }

    for (i = 0; i < bNameCount; ++i) {
        name = bNames[i];

        if (!hasOwn.call(seenNames, name)) {
            problemPath.push(name);
            return false;
        }

        delete seenNames[name];
    }

    for (name in seenNames) {
        problemPath.push(name);
        break;
    }

    return false;
}

module.exports = astNodesAreEquivalent;

},{"../main":45,"assert":1}],39:[function(require,module,exports){
var assert = require("assert");
var types = require("./types");
var n = types.namedTypes;
var b = types.builders;
var isNumber = types.builtInTypes.number;
var isArray = types.builtInTypes.array;
var Path = require("./path");
var Scope = require("./scope");

function NodePath(value, parentPath, name) {
    assert.ok(this instanceof NodePath);
    Path.call(this, value, parentPath, name);
}

require("util").inherits(NodePath, Path);
var NPp = NodePath.prototype;

Object.defineProperties(NPp, {
    node: {
        get: function() {
            Object.defineProperty(this, "node", {
                configurable: true, // Enable deletion.
                value: this._computeNode()
            });

            return this.node;
        }
    },

    parent: {
        get: function() {
            Object.defineProperty(this, "parent", {
                configurable: true, // Enable deletion.
                value: this._computeParent()
            });

            return this.parent;
        }
    },

    scope: {
        get: function() {
            Object.defineProperty(this, "scope", {
                configurable: true, // Enable deletion.
                value: this._computeScope()
            });

            return this.scope;
        }
    }
});

NPp.replace = function() {
    delete this.node;
    delete this.parent;
    delete this.scope;
    return Path.prototype.replace.apply(this, arguments);
};

NPp.prune = function() {
    var remainingNodePath = this.parent;

    this.replace();

    return cleanUpNodesAfterPrune(remainingNodePath);
};

// The value of the first ancestor Path whose value is a Node.
NPp._computeNode = function() {
    var value = this.value;
    if (n.Node.check(value)) {
        return value;
    }

    var pp = this.parentPath;
    return pp && pp.node || null;
};

// The first ancestor Path whose value is a Node distinct from this.node.
NPp._computeParent = function() {
    var value = this.value;
    var pp = this.parentPath;

    if (!n.Node.check(value)) {
        while (pp && !n.Node.check(pp.value)) {
            pp = pp.parentPath;
        }

        if (pp) {
            pp = pp.parentPath;
        }
    }

    while (pp && !n.Node.check(pp.value)) {
        pp = pp.parentPath;
    }

    return pp || null;
};

// The closest enclosing scope that governs this node.
NPp._computeScope = function() {
    var value = this.value;
    var pp = this.parentPath;
    var scope = pp && pp.scope;

    if (n.Node.check(value) &&
        Scope.isEstablishedBy(value)) {
        scope = new Scope(this, scope);
    }

    return scope || null;
};

NPp.getValueProperty = function(name) {
    return types.getFieldValue(this.value, name);
};

/**
 * Determine whether this.node needs to be wrapped in parentheses in order
 * for a parser to reproduce the same local AST structure.
 *
 * For instance, in the expression `(1 + 2) * 3`, the BinaryExpression
 * whose operator is "+" needs parentheses, because `1 + 2 * 3` would
 * parse differently.
 *
 * If assumeExpressionContext === true, we don't worry about edge cases
 * like an anonymous FunctionExpression appearing lexically first in its
 * enclosing statement and thus needing parentheses to avoid being parsed
 * as a FunctionDeclaration with a missing name.
 */
NPp.needsParens = function(assumeExpressionContext) {
    var pp = this.parentPath;
    if (!pp) {
        return false;
    }

    var node = this.value;

    // Only expressions need parentheses.
    if (!n.Expression.check(node)) {
        return false;
    }

    // Identifiers never need parentheses.
    if (node.type === "Identifier") {
        return false;
    }

    while (!n.Node.check(pp.value)) {
        pp = pp.parentPath;
        if (!pp) {
            return false;
        }
    }

    var parent = pp.value;

    switch (node.type) {
    case "UnaryExpression":
    case "SpreadElement":
    case "SpreadProperty":
        return parent.type === "MemberExpression"
            && this.name === "object"
            && parent.object === node;

    case "BinaryExpression":
    case "LogicalExpression":
        switch (parent.type) {
        case "CallExpression":
            return this.name === "callee"
                && parent.callee === node;

        case "UnaryExpression":
        case "SpreadElement":
        case "SpreadProperty":
            return true;

        case "MemberExpression":
            return this.name === "object"
                && parent.object === node;

        case "BinaryExpression":
        case "LogicalExpression":
            var po = parent.operator;
            var pp = PRECEDENCE[po];
            var no = node.operator;
            var np = PRECEDENCE[no];

            if (pp > np) {
                return true;
            }

            if (pp === np && this.name === "right") {
                assert.strictEqual(parent.right, node);
                return true;
            }

        default:
            return false;
        }

    case "SequenceExpression":
        switch (parent.type) {
        case "ForStatement":
            // Although parentheses wouldn't hurt around sequence
            // expressions in the head of for loops, traditional style
            // dictates that e.g. i++, j++ should not be wrapped with
            // parentheses.
            return false;

        case "ExpressionStatement":
            return this.name !== "expression";

        default:
            // Otherwise err on the side of overparenthesization, adding
            // explicit exceptions above if this proves overzealous.
            return true;
        }

    case "YieldExpression":
        switch (parent.type) {
        case "BinaryExpression":
        case "LogicalExpression":
        case "UnaryExpression":
        case "SpreadElement":
        case "SpreadProperty":
        case "CallExpression":
        case "MemberExpression":
        case "NewExpression":
        case "ConditionalExpression":
        case "YieldExpression":
            return true;

        default:
            return false;
        }

    case "Literal":
        return parent.type === "MemberExpression"
            && isNumber.check(node.value)
            && this.name === "object"
            && parent.object === node;

    case "AssignmentExpression":
    case "ConditionalExpression":
        switch (parent.type) {
        case "UnaryExpression":
        case "SpreadElement":
        case "SpreadProperty":
        case "BinaryExpression":
        case "LogicalExpression":
            return true;

        case "CallExpression":
            return this.name === "callee"
                && parent.callee === node;

        case "ConditionalExpression":
            return this.name === "test"
                && parent.test === node;

        case "MemberExpression":
            return this.name === "object"
                && parent.object === node;

        default:
            return false;
        }

    default:
        if (parent.type === "NewExpression" &&
            this.name === "callee" &&
            parent.callee === node) {
            return containsCallExpression(node);
        }
    }

    if (assumeExpressionContext !== true &&
        !this.canBeFirstInStatement() &&
        this.firstInStatement())
        return true;

    return false;
};

function isBinary(node) {
    return n.BinaryExpression.check(node)
        || n.LogicalExpression.check(node);
}

function isUnaryLike(node) {
    return n.UnaryExpression.check(node)
        // I considered making SpreadElement and SpreadProperty subtypes
        // of UnaryExpression, but they're not really Expression nodes.
        || (n.SpreadElement && n.SpreadElement.check(node))
        || (n.SpreadProperty && n.SpreadProperty.check(node));
}

var PRECEDENCE = {};
[["||"],
 ["&&"],
 ["|"],
 ["^"],
 ["&"],
 ["==", "===", "!=", "!=="],
 ["<", ">", "<=", ">=", "in", "instanceof"],
 [">>", "<<", ">>>"],
 ["+", "-"],
 ["*", "/", "%"]
].forEach(function(tier, i) {
    tier.forEach(function(op) {
        PRECEDENCE[op] = i;
    });
});

function containsCallExpression(node) {
    if (n.CallExpression.check(node)) {
        return true;
    }

    if (isArray.check(node)) {
        return node.some(containsCallExpression);
    }

    if (n.Node.check(node)) {
        return types.someField(node, function(name, child) {
            return containsCallExpression(child);
        });
    }

    return false;
}

NPp.canBeFirstInStatement = function() {
    var node = this.node;
    return !n.FunctionExpression.check(node)
        && !n.ObjectExpression.check(node);
};

NPp.firstInStatement = function() {
    return firstInStatement(this);
};

function firstInStatement(path) {
    for (var node, parent; path.parent; path = path.parent) {
        node = path.node;
        parent = path.parent.node;

        if (n.BlockStatement.check(parent) &&
            path.parent.name === "body" &&
            path.name === 0) {
            assert.strictEqual(parent.body[0], node);
            return true;
        }

        if (n.ExpressionStatement.check(parent) &&
            path.name === "expression") {
            assert.strictEqual(parent.expression, node);
            return true;
        }

        if (n.SequenceExpression.check(parent) &&
            path.parent.name === "expressions" &&
            path.name === 0) {
            assert.strictEqual(parent.expressions[0], node);
            continue;
        }

        if (n.CallExpression.check(parent) &&
            path.name === "callee") {
            assert.strictEqual(parent.callee, node);
            continue;
        }

        if (n.MemberExpression.check(parent) &&
            path.name === "object") {
            assert.strictEqual(parent.object, node);
            continue;
        }

        if (n.ConditionalExpression.check(parent) &&
            path.name === "test") {
            assert.strictEqual(parent.test, node);
            continue;
        }

        if (isBinary(parent) &&
            path.name === "left") {
            assert.strictEqual(parent.left, node);
            continue;
        }

        if (n.UnaryExpression.check(parent) &&
            !parent.prefix &&
            path.name === "argument") {
            assert.strictEqual(parent.argument, node);
            continue;
        }

        return false;
    }

    return true;
}

/**
 * Pruning certain nodes will result in empty or incomplete nodes, here we clean those nodes up.
 */
function cleanUpNodesAfterPrune(remainingNodePath) {
    if (n.VariableDeclaration.check(remainingNodePath.node)) {
        var declarations = remainingNodePath.get('declarations').value;
        if (!declarations || declarations.length === 0) {
            return remainingNodePath.prune();
        }
    } else if (n.ExpressionStatement.check(remainingNodePath.node)) {
        if (!remainingNodePath.get('expression').value) {
            return remainingNodePath.prune();
        }
    } else if (n.IfStatement.check(remainingNodePath.node)) {
        cleanUpIfStatementAfterPrune(remainingNodePath);
    }

    return remainingNodePath;
}

function cleanUpIfStatementAfterPrune(ifStatement) {
    var testExpression = ifStatement.get('test').value;
    var alternate = ifStatement.get('alternate').value;
    var consequent = ifStatement.get('consequent').value;

    if (!consequent && !alternate) {
        var testExpressionStatement = b.expressionStatement(testExpression);

        ifStatement.replace(testExpressionStatement);
    } else if (!consequent && alternate) {
        var negatedTestExpression = b.unaryExpression('!', testExpression, true);

        if (n.UnaryExpression.check(testExpression) && testExpression.operator === '!') {
            negatedTestExpression = testExpression.argument;
        }

        ifStatement.get("test").replace(negatedTestExpression);
        ifStatement.get("consequent").replace(alternate);
        ifStatement.get("alternate").replace();
    }
}

module.exports = NodePath;

},{"./path":41,"./scope":42,"./types":44,"assert":1,"util":5}],40:[function(require,module,exports){
var assert = require("assert");
var types = require("./types");
var NodePath = require("./node-path");
var Node = types.namedTypes.Node;
var isArray = types.builtInTypes.array;
var isObject = types.builtInTypes.object;
var isFunction = types.builtInTypes.function;
var hasOwn = Object.prototype.hasOwnProperty;
var undefined;

function PathVisitor() {
    assert.ok(this instanceof PathVisitor);

    // Permanent state.
    this._reusableContextStack = [];
    this._methodNameTable = computeMethodNameTable(this);
    this.Context = makeContextConstructor(this);

    // State reset every time PathVisitor.prototype.visit is called.
    this._visiting = false;
    this._changeReported = false;
}

function computeMethodNameTable(visitor) {
    var typeNames = Object.create(null);

    for (var methodName in visitor) {
        if (/^visit[A-Z]/.test(methodName)) {
            typeNames[methodName.slice("visit".length)] = true;
        }
    }

    var supertypeTable = types.computeSupertypeLookupTable(typeNames);
    var methodNameTable = Object.create(null);

    var typeNames = Object.keys(supertypeTable);
    var typeNameCount = typeNames.length;
    for (var i = 0; i < typeNameCount; ++i) {
        var typeName = typeNames[i];
        methodName = "visit" + supertypeTable[typeName];
        if (isFunction.check(visitor[methodName])) {
            methodNameTable[typeName] = methodName;
        }
    }

    return methodNameTable;
}

PathVisitor.fromMethodsObject = function fromMethodsObject(methods) {
    if (methods instanceof PathVisitor) {
        return methods;
    }

    if (!isObject.check(methods)) {
        // An empty visitor?
        return new PathVisitor;
    }

    function Visitor() {
        assert.ok(this instanceof Visitor);
        PathVisitor.call(this);
    }

    var Vp = Visitor.prototype = Object.create(PVp);
    Vp.constructor = Visitor;

    extend(Vp, methods);
    extend(Visitor, PathVisitor);

    isFunction.assert(Visitor.fromMethodsObject);
    isFunction.assert(Visitor.visit);

    return new Visitor;
};

function extend(target, source) {
    for (var property in source) {
        if (hasOwn.call(source, property)) {
            target[property] = source[property];
        }
    }

    return target;
}

PathVisitor.visit = function visit(node, methods) {
    return PathVisitor.fromMethodsObject(methods).visit(node);
};

var PVp = PathVisitor.prototype;

var recursiveVisitWarning = [
    "Recursively calling visitor.visit(path) resets visitor state.",
    "Try this.visit(path) or this.traverse(path) instead."
].join(" ");

PVp.visit = function() {
    assert.ok(!this._visiting, recursiveVisitWarning);

    // Private state that needs to be reset before every traversal.
    this._visiting = true;
    this._changeReported = false;

    var argc = arguments.length;
    var args = new Array(argc)
    for (var i = 0; i < argc; ++i) {
        args[i] = arguments[i];
    }

    if (!(args[0] instanceof NodePath)) {
        args[0] = new NodePath({ root: args[0] }).get("root");
    }

    // Called with the same arguments as .visit.
    this.reset.apply(this, args);

    try {
        return this.visitWithoutReset(args[0]);
    } finally {
        this._visiting = false;
    }
};

PVp.reset = function(path/*, additional arguments */) {
    // Empty stub; may be reassigned or overridden by subclasses.
};

PVp.visitWithoutReset = function(path) {
    if (this instanceof this.Context) {
        // Since this.Context.prototype === this, there's a chance we
        // might accidentally call context.visitWithoutReset. If that
        // happens, re-invoke the method against context.visitor.
        return this.visitor.visitWithoutReset(path);
    }

    assert.ok(path instanceof NodePath);
    var value = path.value;

    var methodName = Node.check(value) && this._methodNameTable[value.type];
    if (methodName) {
        var context = this.acquireContext(path);
        try {
            return context.invokeVisitorMethod(methodName);
        } finally {
            this.releaseContext(context);
        }

    } else {
        // If there was no visitor method to call, visit the children of
        // this node generically.
        return visitChildren(path, this);
    }
};

function visitChildren(path, visitor) {
    assert.ok(path instanceof NodePath);
    assert.ok(visitor instanceof PathVisitor);

    var value = path.value;

    if (isArray.check(value)) {
        path.each(visitor.visitWithoutReset, visitor);
    } else if (!isObject.check(value)) {
        // No children to visit.
    } else {
        var childNames = types.getFieldNames(value);
        var childCount = childNames.length;
        var childPaths = [];

        for (var i = 0; i < childCount; ++i) {
            var childName = childNames[i];
            if (!hasOwn.call(value, childName)) {
                value[childName] = types.getFieldValue(value, childName);
            }
            childPaths.push(path.get(childName));
        }

        for (var i = 0; i < childCount; ++i) {
            visitor.visitWithoutReset(childPaths[i]);
        }
    }

    return path.value;
}

PVp.acquireContext = function(path) {
    if (this._reusableContextStack.length === 0) {
        return new this.Context(path);
    }
    return this._reusableContextStack.pop().reset(path);
};

PVp.releaseContext = function(context) {
    assert.ok(context instanceof this.Context);
    this._reusableContextStack.push(context);
    context.currentPath = null;
};

PVp.reportChanged = function() {
    this._changeReported = true;
};

PVp.wasChangeReported = function() {
    return this._changeReported;
};

function makeContextConstructor(visitor) {
    function Context(path) {
        assert.ok(this instanceof Context);
        assert.ok(this instanceof PathVisitor);
        assert.ok(path instanceof NodePath);

        Object.defineProperty(this, "visitor", {
            value: visitor,
            writable: false,
            enumerable: true,
            configurable: false
        });

        this.currentPath = path;
        this.needToCallTraverse = true;

        Object.seal(this);
    }

    assert.ok(visitor instanceof PathVisitor);

    // Note that the visitor object is the prototype of Context.prototype,
    // so all visitor methods are inherited by context objects.
    var Cp = Context.prototype = Object.create(visitor);

    Cp.constructor = Context;
    extend(Cp, sharedContextProtoMethods);

    return Context;
}

// Every PathVisitor has a different this.Context constructor and
// this.Context.prototype object, but those prototypes can all use the
// same reset, invokeVisitorMethod, and traverse function objects.
var sharedContextProtoMethods = Object.create(null);

sharedContextProtoMethods.reset =
function reset(path) {
    assert.ok(this instanceof this.Context);
    assert.ok(path instanceof NodePath);

    this.currentPath = path;
    this.needToCallTraverse = true;

    return this;
};

sharedContextProtoMethods.invokeVisitorMethod =
function invokeVisitorMethod(methodName) {
    assert.ok(this instanceof this.Context);
    assert.ok(this.currentPath instanceof NodePath);

    var result = this.visitor[methodName].call(this, this.currentPath);

    if (result === false) {
        // Visitor methods return false to indicate that they have handled
        // their own traversal needs, and we should not complain if
        // this.needToCallTraverse is still true.
        this.needToCallTraverse = false;

    } else if (result !== undefined) {
        // Any other non-undefined value returned from the visitor method
        // is interpreted as a replacement value.
        this.currentPath = this.currentPath.replace(result)[0];

        if (this.needToCallTraverse) {
            // If this.traverse still hasn't been called, visit the
            // children of the replacement node.
            this.traverse(this.currentPath);
        }
    }

    assert.strictEqual(
        this.needToCallTraverse, false,
        "Must either call this.traverse or return false in " + methodName
    );

    var path = this.currentPath;
    return path && path.value;
};

sharedContextProtoMethods.traverse =
function traverse(path, newVisitor) {
    assert.ok(this instanceof this.Context);
    assert.ok(path instanceof NodePath);
    assert.ok(this.currentPath instanceof NodePath);

    this.needToCallTraverse = false;

    return visitChildren(path, PathVisitor.fromMethodsObject(
        newVisitor || this.visitor
    ));
};

sharedContextProtoMethods.visit =
function visit(path, newVisitor) {
    assert.ok(this instanceof this.Context);
    assert.ok(path instanceof NodePath);
    assert.ok(this.currentPath instanceof NodePath);

    this.needToCallTraverse = false;

    return PathVisitor.fromMethodsObject(
        newVisitor || this.visitor
    ).visitWithoutReset(path);
};

sharedContextProtoMethods.reportChanged = function reportChanged() {
    this.visitor.reportChanged();
};

module.exports = PathVisitor;

},{"./node-path":39,"./types":44,"assert":1}],41:[function(require,module,exports){
var assert = require("assert");
var Op = Object.prototype;
var hasOwn = Op.hasOwnProperty;
var types = require("./types");
var isArray = types.builtInTypes.array;
var isNumber = types.builtInTypes.number;
var Ap = Array.prototype;
var slice = Ap.slice;
var map = Ap.map;

function Path(value, parentPath, name) {
    assert.ok(this instanceof Path);

    if (parentPath) {
        assert.ok(parentPath instanceof Path);
    } else {
        parentPath = null;
        name = null;
    }

    // The value encapsulated by this Path, generally equal to
    // parentPath.value[name] if we have a parentPath.
    this.value = value;

    // The immediate parent Path of this Path.
    this.parentPath = parentPath;

    // The name of the property of parentPath.value through which this
    // Path's value was reached.
    this.name = name;

    // Calling path.get("child") multiple times always returns the same
    // child Path object, for both performance and consistency reasons.
    this.__childCache = null;
}

var Pp = Path.prototype;

function getChildCache(path) {
    // Lazily create the child cache. This also cheapens cache
    // invalidation, since you can just reset path.__childCache to null.
    return path.__childCache || (path.__childCache = Object.create(null));
}

function getChildPath(path, name) {
    var cache = getChildCache(path);
    var actualChildValue = path.getValueProperty(name);
    var childPath = cache[name];
    if (!hasOwn.call(cache, name) ||
        // Ensure consistency between cache and reality.
        childPath.value !== actualChildValue) {
        childPath = cache[name] = new path.constructor(
            actualChildValue, path, name
        );
    }
    return childPath;
}

// This method is designed to be overridden by subclasses that need to
// handle missing properties, etc.
Pp.getValueProperty = function getValueProperty(name) {
    return this.value[name];
};

Pp.get = function get(name) {
    var path = this;
    var names = arguments;
    var count = names.length;

    for (var i = 0; i < count; ++i) {
        path = getChildPath(path, names[i]);
    }

    return path;
};

Pp.each = function each(callback, context) {
    var childPaths = [];
    var len = this.value.length;
    var i = 0;

    // Collect all the original child paths before invoking the callback.
    for (var i = 0; i < len; ++i) {
        if (hasOwn.call(this.value, i)) {
            childPaths[i] = this.get(i);
        }
    }

    // Invoke the callback on just the original child paths, regardless of
    // any modifications made to the array by the callback. I chose these
    // semantics over cleverly invoking the callback on new elements because
    // this way is much easier to reason about.
    context = context || this;
    for (i = 0; i < len; ++i) {
        if (hasOwn.call(childPaths, i)) {
            callback.call(context, childPaths[i]);
        }
    }
};

Pp.map = function map(callback, context) {
    var result = [];

    this.each(function(childPath) {
        result.push(callback.call(this, childPath));
    }, context);

    return result;
};

Pp.filter = function filter(callback, context) {
    var result = [];

    this.each(function(childPath) {
        if (callback.call(this, childPath)) {
            result.push(childPath);
        }
    }, context);

    return result;
};

function emptyMoves() {}
function getMoves(path, offset, start, end) {
    isArray.assert(path.value);

    if (offset === 0) {
        return emptyMoves;
    }

    var length = path.value.length;
    if (length < 1) {
        return emptyMoves;
    }

    var argc = arguments.length;
    if (argc === 2) {
        start = 0;
        end = length;
    } else if (argc === 3) {
        start = Math.max(start, 0);
        end = length;
    } else {
        start = Math.max(start, 0);
        end = Math.min(end, length);
    }

    isNumber.assert(start);
    isNumber.assert(end);

    var moves = Object.create(null);
    var cache = getChildCache(path);

    for (var i = start; i < end; ++i) {
        if (hasOwn.call(path.value, i)) {
            var childPath = path.get(i);
            assert.strictEqual(childPath.name, i);
            var newIndex = i + offset;
            childPath.name = newIndex;
            moves[newIndex] = childPath;
            delete cache[i];
        }
    }

    delete cache.length;

    return function() {
        for (var newIndex in moves) {
            var childPath = moves[newIndex];
            assert.strictEqual(childPath.name, +newIndex);
            cache[newIndex] = childPath;
            path.value[newIndex] = childPath.value;
        }
    };
}

Pp.shift = function shift() {
    var move = getMoves(this, -1);
    var result = this.value.shift();
    move();
    return result;
};

Pp.unshift = function unshift(node) {
    var move = getMoves(this, arguments.length);
    var result = this.value.unshift.apply(this.value, arguments);
    move();
    return result;
};

Pp.push = function push(node) {
    isArray.assert(this.value);
    delete getChildCache(this).length
    return this.value.push.apply(this.value, arguments);
};

Pp.pop = function pop() {
    isArray.assert(this.value);
    var cache = getChildCache(this);
    delete cache[this.value.length - 1];
    delete cache.length;
    return this.value.pop();
};

Pp.insertAt = function insertAt(index, node) {
    var argc = arguments.length;
    var move = getMoves(this, argc - 1, index);
    if (move === emptyMoves) {
        return this;
    }

    index = Math.max(index, 0);

    for (var i = 1; i < argc; ++i) {
        this.value[index + i - 1] = arguments[i];
    }

    move();

    return this;
};

Pp.insertBefore = function insertBefore(node) {
    var pp = this.parentPath;
    var argc = arguments.length;
    var insertAtArgs = [this.name];
    for (var i = 0; i < argc; ++i) {
        insertAtArgs.push(arguments[i]);
    }
    return pp.insertAt.apply(pp, insertAtArgs);
};

Pp.insertAfter = function insertAfter(node) {
    var pp = this.parentPath;
    var argc = arguments.length;
    var insertAtArgs = [this.name + 1];
    for (var i = 0; i < argc; ++i) {
        insertAtArgs.push(arguments[i]);
    }
    return pp.insertAt.apply(pp, insertAtArgs);
};

function repairRelationshipWithParent(path) {
    assert.ok(path instanceof Path);

    var pp = path.parentPath;
    if (!pp) {
        // Orphan paths have no relationship to repair.
        return path;
    }

    var parentValue = pp.value;
    var parentCache = getChildCache(pp);

    // Make sure parentCache[path.name] is populated.
    if (parentValue[path.name] === path.value) {
        parentCache[path.name] = path;
    } else if (isArray.check(parentValue)) {
        // Something caused path.name to become out of date, so attempt to
        // recover by searching for path.value in parentValue.
        var i = parentValue.indexOf(path.value);
        if (i >= 0) {
            parentCache[path.name = i] = path;
        }
    } else {
        // If path.value disagrees with parentValue[path.name], and
        // path.name is not an array index, let path.value become the new
        // parentValue[path.name] and update parentCache accordingly.
        parentValue[path.name] = path.value;
        parentCache[path.name] = path;
    }

    assert.strictEqual(parentValue[path.name], path.value);
    assert.strictEqual(path.parentPath.get(path.name), path);

    return path;
}

Pp.replace = function replace(replacement) {
    var results = [];
    var parentValue = this.parentPath.value;
    var parentCache = getChildCache(this.parentPath);
    var count = arguments.length;

    repairRelationshipWithParent(this);

    if (isArray.check(parentValue)) {
        var originalLength = parentValue.length;
        var move = getMoves(this.parentPath, count - 1, this.name + 1);

        var spliceArgs = [this.name, 1];
        for (var i = 0; i < count; ++i) {
            spliceArgs.push(arguments[i]);
        }

        var splicedOut = parentValue.splice.apply(parentValue, spliceArgs);

        assert.strictEqual(splicedOut[0], this.value);
        assert.strictEqual(
            parentValue.length,
            originalLength - 1 + count
        );

        move();

        if (count === 0) {
            delete this.value;
            delete parentCache[this.name];
            this.__childCache = null;

        } else {
            assert.strictEqual(parentValue[this.name], replacement);

            if (this.value !== replacement) {
                this.value = replacement;
                this.__childCache = null;
            }

            for (i = 0; i < count; ++i) {
                results.push(this.parentPath.get(this.name + i));
            }

            assert.strictEqual(results[0], this);
        }

    } else if (count === 1) {
        if (this.value !== replacement) {
            this.__childCache = null;
        }
        this.value = parentValue[this.name] = replacement;
        results.push(this);

    } else if (count === 0) {
        delete parentValue[this.name];
        delete this.value;
        this.__childCache = null;

        // Leave this path cached as parentCache[this.name], even though
        // it no longer has a value defined.

    } else {
        assert.ok(false, "Could not replace path");
    }

    return results;
};

module.exports = Path;

},{"./types":44,"assert":1}],42:[function(require,module,exports){
var assert = require("assert");
var types = require("./types");
var Type = types.Type;
var namedTypes = types.namedTypes;
var Node = namedTypes.Node;
var Expression = namedTypes.Expression;
var isArray = types.builtInTypes.array;
var hasOwn = Object.prototype.hasOwnProperty;
var b = types.builders;

function Scope(path, parentScope) {
    assert.ok(this instanceof Scope);
    assert.ok(path instanceof require("./node-path"));
    ScopeType.assert(path.value);

    var depth;

    if (parentScope) {
        assert.ok(parentScope instanceof Scope);
        depth = parentScope.depth + 1;
    } else {
        parentScope = null;
        depth = 0;
    }

    Object.defineProperties(this, {
        path: { value: path },
        node: { value: path.value },
        isGlobal: { value: !parentScope, enumerable: true },
        depth: { value: depth },
        parent: { value: parentScope },
        bindings: { value: {} }
    });
}

var scopeTypes = [
    // Program nodes introduce global scopes.
    namedTypes.Program,

    // Function is the supertype of FunctionExpression,
    // FunctionDeclaration, ArrowExpression, etc.
    namedTypes.Function,

    // In case you didn't know, the caught parameter shadows any variable
    // of the same name in an outer scope.
    namedTypes.CatchClause
];

var ScopeType = Type.or.apply(Type, scopeTypes);

Scope.isEstablishedBy = function(node) {
    return ScopeType.check(node);
};

var Sp = Scope.prototype;

// Will be overridden after an instance lazily calls scanScope.
Sp.didScan = false;

Sp.declares = function(name) {
    this.scan();
    return hasOwn.call(this.bindings, name);
};

Sp.declareTemporary = function(prefix) {
    if (prefix) {
        assert.ok(/^[a-z$_]/i.test(prefix), prefix);
    } else {
        prefix = "t$";
    }

    // Include this.depth in the name to make sure the name does not
    // collide with any variables in nested/enclosing scopes.
    prefix += this.depth.toString(36) + "$";

    this.scan();

    var index = 0;
    while (this.declares(prefix + index)) {
        ++index;
    }

    var name = prefix + index;
    return this.bindings[name] = types.builders.identifier(name);
};

Sp.injectTemporary = function(identifier, init) {
    identifier || (identifier = this.declareTemporary());

    var bodyPath = this.path.get("body");
    if (namedTypes.BlockStatement.check(bodyPath.value)) {
        bodyPath = bodyPath.get("body");
    }

    bodyPath.unshift(
        b.variableDeclaration(
            "var",
            [b.variableDeclarator(identifier, init || null)]
        )
    );

    return identifier;
};

Sp.scan = function(force) {
    if (force || !this.didScan) {
        for (var name in this.bindings) {
            // Empty out this.bindings, just in cases.
            delete this.bindings[name];
        }
        scanScope(this.path, this.bindings);
        this.didScan = true;
    }
};

Sp.getBindings = function () {
    this.scan();
    return this.bindings;
};

function scanScope(path, bindings) {
    var node = path.value;
    ScopeType.assert(node);

    if (namedTypes.CatchClause.check(node)) {
        // A catch clause establishes a new scope but the only variable
        // bound in that scope is the catch parameter. Any other
        // declarations create bindings in the outer scope.
        addPattern(path.get("param"), bindings);

    } else {
        recursiveScanScope(path, bindings);
    }
}

function recursiveScanScope(path, bindings) {
    var node = path.value;

    if (path.parent &&
        namedTypes.FunctionExpression.check(path.parent.node) &&
        path.parent.node.id) {
        addPattern(path.parent.get("id"), bindings);
    }

    if (!node) {
        // None of the remaining cases matter if node is falsy.

    } else if (isArray.check(node)) {
        path.each(function(childPath) {
            recursiveScanChild(childPath, bindings);
        });

    } else if (namedTypes.Function.check(node)) {
        path.get("params").each(function(paramPath) {
            addPattern(paramPath, bindings);
        });

        recursiveScanChild(path.get("body"), bindings);

    } else if (namedTypes.VariableDeclarator.check(node)) {
        addPattern(path.get("id"), bindings);
        recursiveScanChild(path.get("init"), bindings);

    } else if (node.type === "ImportSpecifier" ||
               node.type === "ImportNamespaceSpecifier" ||
               node.type === "ImportDefaultSpecifier") {
        addPattern(
            node.name ? path.get("name") : path.get("id"),
            bindings
        );

    } else if (Node.check(node) && !Expression.check(node)) {
        types.eachField(node, function(name, child) {
            var childPath = path.get(name);
            assert.strictEqual(childPath.value, child);
            recursiveScanChild(childPath, bindings);
        });
    }
}

function recursiveScanChild(path, bindings) {
    var node = path.value;

    if (!node || Expression.check(node)) {
        // Ignore falsy values and Expressions.

    } else if (namedTypes.FunctionDeclaration.check(node)) {
        addPattern(path.get("id"), bindings);

    } else if (namedTypes.ClassDeclaration &&
               namedTypes.ClassDeclaration.check(node)) {
        addPattern(path.get("id"), bindings);

    } else if (ScopeType.check(node)) {
        if (namedTypes.CatchClause.check(node)) {
            var catchParamName = node.param.name;
            var hadBinding = hasOwn.call(bindings, catchParamName);

            // Any declarations that occur inside the catch body that do
            // not have the same name as the catch parameter should count
            // as bindings in the outer scope.
            recursiveScanScope(path.get("body"), bindings);

            // If a new binding matching the catch parameter name was
            // created while scanning the catch body, ignore it because it
            // actually refers to the catch parameter and not the outer
            // scope that we're currently scanning.
            if (!hadBinding) {
                delete bindings[catchParamName];
            }
        }

    } else {
        recursiveScanScope(path, bindings);
    }
}

function addPattern(patternPath, bindings) {
    var pattern = patternPath.value;
    namedTypes.Pattern.assert(pattern);

    if (namedTypes.Identifier.check(pattern)) {
        if (hasOwn.call(bindings, pattern.name)) {
            bindings[pattern.name].push(patternPath);
        } else {
            bindings[pattern.name] = [patternPath];
        }

    } else if (namedTypes.SpreadElement &&
               namedTypes.SpreadElement.check(pattern)) {
        addPattern(patternPath.get("argument"), bindings);
    }
}

Sp.lookup = function(name) {
    for (var scope = this; scope; scope = scope.parent)
        if (scope.declares(name))
            break;
    return scope;
};

Sp.getGlobalScope = function() {
    var scope = this;
    while (!scope.isGlobal)
        scope = scope.parent;
    return scope;
};

module.exports = Scope;

},{"./node-path":39,"./types":44,"assert":1}],43:[function(require,module,exports){
var types = require("../lib/types");
var Type = types.Type;
var builtin = types.builtInTypes;
var isNumber = builtin.number;

// An example of constructing a new type with arbitrary constraints from
// an existing type.
exports.geq = function(than) {
    return new Type(function(value) {
        return isNumber.check(value) && value >= than;
    }, isNumber + " >= " + than);
};

// Default value-returning functions that may optionally be passed as a
// third argument to Def.prototype.field.
exports.defaults = {
    // Functions were used because (among other reasons) that's the most
    // elegant way to allow for the emptyArray one always to give a new
    // array instance.
    "null": function() { return null },
    "emptyArray": function() { return [] },
    "false": function() { return false },
    "true": function() { return true },
    "undefined": function() {}
};

var naiveIsPrimitive = Type.or(
    builtin.string,
    builtin.number,
    builtin.boolean,
    builtin.null,
    builtin.undefined
);

exports.isPrimitive = new Type(function(value) {
    if (value === null)
        return true;
    var type = typeof value;
    return !(type === "object" ||
             type === "function");
}, naiveIsPrimitive.toString());

},{"../lib/types":44}],44:[function(require,module,exports){
var assert = require("assert");
var Ap = Array.prototype;
var slice = Ap.slice;
var map = Ap.map;
var each = Ap.forEach;
var Op = Object.prototype;
var objToStr = Op.toString;
var funObjStr = objToStr.call(function(){});
var strObjStr = objToStr.call("");
var hasOwn = Op.hasOwnProperty;

// A type is an object with a .check method that takes a value and returns
// true or false according to whether the value matches the type.

function Type(check, name) {
    var self = this;
    assert.ok(self instanceof Type, self);

    // Unfortunately we can't elegantly reuse isFunction and isString,
    // here, because this code is executed while defining those types.
    assert.strictEqual(objToStr.call(check), funObjStr,
                       check + " is not a function");

    // The `name` parameter can be either a function or a string.
    var nameObjStr = objToStr.call(name);
    assert.ok(nameObjStr === funObjStr ||
              nameObjStr === strObjStr,
              name + " is neither a function nor a string");

    Object.defineProperties(self, {
        name: { value: name },
        check: {
            value: function(value, deep) {
                var result = check.call(self, value, deep);
                if (!result && deep && objToStr.call(deep) === funObjStr)
                    deep(self, value);
                return result;
            }
        }
    });
}

var Tp = Type.prototype;

// Throughout this file we use Object.defineProperty to prevent
// redefinition of exported properties.
exports.Type = Type;

// Like .check, except that failure triggers an AssertionError.
Tp.assert = function(value, deep) {
    if (!this.check(value, deep)) {
        var str = shallowStringify(value);
        assert.ok(false, str + " does not match type " + this);
        return false;
    }
    return true;
};

function shallowStringify(value) {
    if (isObject.check(value))
        return "{" + Object.keys(value).map(function(key) {
            return key + ": " + value[key];
        }).join(", ") + "}";

    if (isArray.check(value))
        return "[" + value.map(shallowStringify).join(", ") + "]";

    return JSON.stringify(value);
}

Tp.toString = function() {
    var name = this.name;

    if (isString.check(name))
        return name;

    if (isFunction.check(name))
        return name.call(this) + "";

    return name + " type";
};

var builtInTypes = {};
exports.builtInTypes = builtInTypes;

function defBuiltInType(example, name) {
    var objStr = objToStr.call(example);

    Object.defineProperty(builtInTypes, name, {
        enumerable: true,
        value: new Type(function(value) {
            return objToStr.call(value) === objStr;
        }, name)
    });

    return builtInTypes[name];
}

// These types check the underlying [[Class]] attribute of the given
// value, rather than using the problematic typeof operator. Note however
// that no subtyping is considered; so, for instance, isObject.check
// returns false for [], /./, new Date, and null.
var isString = defBuiltInType("", "string");
var isFunction = defBuiltInType(function(){}, "function");
var isArray = defBuiltInType([], "array");
var isObject = defBuiltInType({}, "object");
var isRegExp = defBuiltInType(/./, "RegExp");
var isDate = defBuiltInType(new Date, "Date");
var isNumber = defBuiltInType(3, "number");
var isBoolean = defBuiltInType(true, "boolean");
var isNull = defBuiltInType(null, "null");
var isUndefined = defBuiltInType(void 0, "undefined");

// There are a number of idiomatic ways of expressing types, so this
// function serves to coerce them all to actual Type objects. Note that
// providing the name argument is not necessary in most cases.
function toType(from, name) {
    // The toType function should of course be idempotent.
    if (from instanceof Type)
        return from;

    // The Def type is used as a helper for constructing compound
    // interface types for AST nodes.
    if (from instanceof Def)
        return from.type;

    // Support [ElemType] syntax.
    if (isArray.check(from))
        return Type.fromArray(from);

    // Support { someField: FieldType, ... } syntax.
    if (isObject.check(from))
        return Type.fromObject(from);

    // If isFunction.check(from), assume that from is a binary predicate
    // function we can use to define the type.
    if (isFunction.check(from))
        return new Type(from, name);

    // As a last resort, toType returns a type that matches any value that
    // is === from. This is primarily useful for literal values like
    // toType(null), but it has the additional advantage of allowing
    // toType to be a total function.
    return new Type(function(value) {
        return value === from;
    }, isUndefined.check(name) ? function() {
        return from + "";
    } : name);
}

// Returns a type that matches the given value iff any of type1, type2,
// etc. match the value.
Type.or = function(/* type1, type2, ... */) {
    var types = [];
    var len = arguments.length;
    for (var i = 0; i < len; ++i)
        types.push(toType(arguments[i]));

    return new Type(function(value, deep) {
        for (var i = 0; i < len; ++i)
            if (types[i].check(value, deep))
                return true;
        return false;
    }, function() {
        return types.join(" | ");
    });
};

Type.fromArray = function(arr) {
    assert.ok(isArray.check(arr));
    assert.strictEqual(
        arr.length, 1,
        "only one element type is permitted for typed arrays");
    return toType(arr[0]).arrayOf();
};

Tp.arrayOf = function() {
    var elemType = this;
    return new Type(function(value, deep) {
        return isArray.check(value) && value.every(function(elem) {
            return elemType.check(elem, deep);
        });
    }, function() {
        return "[" + elemType + "]";
    });
};

Type.fromObject = function(obj) {
    var fields = Object.keys(obj).map(function(name) {
        return new Field(name, obj[name]);
    });

    return new Type(function(value, deep) {
        return isObject.check(value) && fields.every(function(field) {
            return field.type.check(value[field.name], deep);
        });
    }, function() {
        return "{ " + fields.join(", ") + " }";
    });
};

function Field(name, type, defaultFn, hidden) {
    var self = this;

    assert.ok(self instanceof Field);
    isString.assert(name);

    type = toType(type);

    var properties = {
        name: { value: name },
        type: { value: type },
        hidden: { value: !!hidden }
    };

    if (isFunction.check(defaultFn)) {
        properties.defaultFn = { value: defaultFn };
    }

    Object.defineProperties(self, properties);
}

var Fp = Field.prototype;

Fp.toString = function() {
    return JSON.stringify(this.name) + ": " + this.type;
};

Fp.getValue = function(obj) {
    var value = obj[this.name];

    if (!isUndefined.check(value))
        return value;

    if (this.defaultFn)
        value = this.defaultFn.call(obj);

    return value;
};

// Define a type whose name is registered in a namespace (the defCache) so
// that future definitions will return the same type given the same name.
// In particular, this system allows for circular and forward definitions.
// The Def object d returned from Type.def may be used to configure the
// type d.type by calling methods such as d.bases, d.build, and d.field.
Type.def = function(typeName) {
    isString.assert(typeName);
    return hasOwn.call(defCache, typeName)
        ? defCache[typeName]
        : defCache[typeName] = new Def(typeName);
};

// In order to return the same Def instance every time Type.def is called
// with a particular name, those instances need to be stored in a cache.
var defCache = Object.create(null);

function Def(typeName) {
    var self = this;
    assert.ok(self instanceof Def);

    Object.defineProperties(self, {
        typeName: { value: typeName },
        baseNames: { value: [] },
        ownFields: { value: Object.create(null) },

        // These two are populated during finalization.
        allSupertypes: { value: Object.create(null) }, // Includes own typeName.
        supertypeList: { value: [] }, // Linear inheritance hierarchy.
        allFields: { value: Object.create(null) }, // Includes inherited fields.
        fieldNames: { value: [] }, // Non-hidden keys of allFields.

        type: {
            value: new Type(function(value, deep) {
                return self.check(value, deep);
            }, typeName)
        }
    });
}

Def.fromValue = function(value) {
    if (value && typeof value === "object") {
        var type = value.type;
        if (typeof type === "string" &&
            hasOwn.call(defCache, type)) {
            var d = defCache[type];
            if (d.finalized) {
                return d;
            }
        }
    }

    return null;
};

var Dp = Def.prototype;

Dp.isSupertypeOf = function(that) {
    if (that instanceof Def) {
        assert.strictEqual(this.finalized, true);
        assert.strictEqual(that.finalized, true);
        return hasOwn.call(that.allSupertypes, this.typeName);
    } else {
        assert.ok(false, that + " is not a Def");
    }
};

// Note that the list returned by this function is a copy of the internal
// supertypeList, *without* the typeName itself as the first element.
exports.getSupertypeNames = function(typeName) {
    assert.ok(hasOwn.call(defCache, typeName));
    var d = defCache[typeName];
    assert.strictEqual(d.finalized, true);
    return d.supertypeList.slice(1);
};

// Returns an object mapping from every known type in the defCache to the
// most specific supertype whose name is an own property of the candidates
// object.
exports.computeSupertypeLookupTable = function(candidates) {
    var table = {};
    var typeNames = Object.keys(defCache);
    var typeNameCount = typeNames.length;

    for (var i = 0; i < typeNameCount; ++i) {
        var typeName = typeNames[i];
        var d = defCache[typeName];
        assert.strictEqual(d.finalized, true);
        for (var j = 0; j < d.supertypeList.length; ++j) {
            var superTypeName = d.supertypeList[j];
            if (hasOwn.call(candidates, superTypeName)) {
                table[typeName] = superTypeName;
                break;
            }
        }
    }

    return table;
};

Dp.checkAllFields = function(value, deep) {
    var allFields = this.allFields;
    assert.strictEqual(this.finalized, true);

    function checkFieldByName(name) {
        var field = allFields[name];
        var type = field.type;
        var child = field.getValue(value);
        return type.check(child, deep);
    }

    return isObject.check(value)
        && Object.keys(allFields).every(checkFieldByName);
};

Dp.check = function(value, deep) {
    assert.strictEqual(
        this.finalized, true,
        "prematurely checking unfinalized type " + this.typeName);

    // A Def type can only match an object value.
    if (!isObject.check(value))
        return false;

    var vDef = Def.fromValue(value);
    if (!vDef) {
        // If we couldn't infer the Def associated with the given value,
        // and we expected it to be a SourceLocation or a Position, it was
        // probably just missing a "type" field (because Esprima does not
        // assign a type property to such nodes). Be optimistic and let
        // this.checkAllFields make the final decision.
        if (this.typeName === "SourceLocation" ||
            this.typeName === "Position") {
            return this.checkAllFields(value, deep);
        }

        // Calling this.checkAllFields for any other type of node is both
        // bad for performance and way too forgiving.
        return false;
    }

    // If checking deeply and vDef === this, then we only need to call
    // checkAllFields once. Calling checkAllFields is too strict when deep
    // is false, because then we only care about this.isSupertypeOf(vDef).
    if (deep && vDef === this)
        return this.checkAllFields(value, deep);

    // In most cases we rely exclusively on isSupertypeOf to make O(1)
    // subtyping determinations. This suffices in most situations outside
    // of unit tests, since interface conformance is checked whenever new
    // instances are created using builder functions.
    if (!this.isSupertypeOf(vDef))
        return false;

    // The exception is when deep is true; then, we recursively check all
    // fields.
    if (!deep)
        return true;

    // Use the more specific Def (vDef) to perform the deep check, but
    // shallow-check fields defined by the less specific Def (this).
    return vDef.checkAllFields(value, deep)
        && this.checkAllFields(value, false);
};

Dp.bases = function() {
    var bases = this.baseNames;

    assert.strictEqual(this.finalized, false);

    each.call(arguments, function(baseName) {
        isString.assert(baseName);

        // This indexOf lookup may be O(n), but the typical number of base
        // names is very small, and indexOf is a native Array method.
        if (bases.indexOf(baseName) < 0)
            bases.push(baseName);
    });

    return this; // For chaining.
};

// False by default until .build(...) is called on an instance.
Object.defineProperty(Dp, "buildable", { value: false });

var builders = {};
exports.builders = builders;

// This object is used as prototype for any node created by a builder.
var nodePrototype = {};

// Call this function to define a new method to be shared by all AST
// nodes. The replaced method (if any) is returned for easy wrapping.
exports.defineMethod = function(name, func) {
    var old = nodePrototype[name];

    // Pass undefined as func to delete nodePrototype[name].
    if (isUndefined.check(func)) {
        delete nodePrototype[name];

    } else {
        isFunction.assert(func);

        Object.defineProperty(nodePrototype, name, {
            enumerable: true, // For discoverability.
            configurable: true, // For delete proto[name].
            value: func
        });
    }

    return old;
};

// Calling the .build method of a Def simultaneously marks the type as
// buildable (by defining builders[getBuilderName(typeName)]) and
// specifies the order of arguments that should be passed to the builder
// function to create an instance of the type.
Dp.build = function(/* param1, param2, ... */) {
    var self = this;

    // Calling Def.prototype.build multiple times has the effect of merely
    // redefining this property.
    Object.defineProperty(self, "buildParams", {
        value: slice.call(arguments),
        writable: false,
        enumerable: false,
        configurable: true
    });

    assert.strictEqual(self.finalized, false);
    isString.arrayOf().assert(self.buildParams);

    if (self.buildable) {
        // If this Def is already buildable, update self.buildParams and
        // continue using the old builder function.
        return self;
    }

    // Every buildable type will have its "type" field filled in
    // automatically. This includes types that are not subtypes of Node,
    // like SourceLocation, but that seems harmless (TODO?).
    self.field("type", self.typeName, function() { return self.typeName });

    // Override Dp.buildable for this Def instance.
    Object.defineProperty(self, "buildable", { value: true });

    Object.defineProperty(builders, getBuilderName(self.typeName), {
        enumerable: true,

        value: function() {
            var args = arguments;
            var argc = args.length;
            var built = Object.create(nodePrototype);

            assert.ok(
                self.finalized,
                "attempting to instantiate unfinalized type " + self.typeName);

            function add(param, i) {
                if (hasOwn.call(built, param))
                    return;

                var all = self.allFields;
                assert.ok(hasOwn.call(all, param), param);

                var field = all[param];
                var type = field.type;
                var value;

                if (isNumber.check(i) && i < argc) {
                    value = args[i];
                } else if (field.defaultFn) {
                    // Expose the partially-built object to the default
                    // function as its `this` object.
                    value = field.defaultFn.call(built);
                } else {
                    var message = "no value or default function given for field " +
                        JSON.stringify(param) + " of " + self.typeName + "(" +
                            self.buildParams.map(function(name) {
                                return all[name];
                            }).join(", ") + ")";
                    assert.ok(false, message);
                }

                if (!type.check(value)) {
                    assert.ok(
                        false,
                        shallowStringify(value) +
                            " does not match field " + field +
                            " of type " + self.typeName
                    );
                }

                // TODO Could attach getters and setters here to enforce
                // dynamic type safety.
                built[param] = value;
            }

            self.buildParams.forEach(function(param, i) {
                add(param, i);
            });

            Object.keys(self.allFields).forEach(function(param) {
                add(param); // Use the default value.
            });

            // Make sure that the "type" field was filled automatically.
            assert.strictEqual(built.type, self.typeName);

            return built;
        }
    });

    return self; // For chaining.
};

function getBuilderName(typeName) {
    return typeName.replace(/^[A-Z]+/, function(upperCasePrefix) {
        var len = upperCasePrefix.length;
        switch (len) {
        case 0: return "";
        // If there's only one initial capital letter, just lower-case it.
        case 1: return upperCasePrefix.toLowerCase();
        default:
            // If there's more than one initial capital letter, lower-case
            // all but the last one, so that XMLDefaultDeclaration (for
            // example) becomes xmlDefaultDeclaration.
            return upperCasePrefix.slice(
                0, len - 1).toLowerCase() +
                upperCasePrefix.charAt(len - 1);
        }
    });
}

// The reason fields are specified using .field(...) instead of an object
// literal syntax is somewhat subtle: the object literal syntax would
// support only one key and one value, but with .field(...) we can pass
// any number of arguments to specify the field.
Dp.field = function(name, type, defaultFn, hidden) {
    assert.strictEqual(this.finalized, false);
    this.ownFields[name] = new Field(name, type, defaultFn, hidden);
    return this; // For chaining.
};

var namedTypes = {};
exports.namedTypes = namedTypes;

// Like Object.keys, but aware of what fields each AST type should have.
function getFieldNames(object) {
    var d = Def.fromValue(object);
    if (d) {
        return d.fieldNames.slice(0);
    }

    if ("type" in object) {
        assert.ok(
            false,
            "did not recognize object of type " +
                JSON.stringify(object.type)
        );
    }

    return Object.keys(object);
}
exports.getFieldNames = getFieldNames;

// Get the value of an object property, taking object.type and default
// functions into account.
function getFieldValue(object, fieldName) {
    var d = Def.fromValue(object);
    if (d) {
        var field = d.allFields[fieldName];
        if (field) {
            return field.getValue(object);
        }
    }

    return object[fieldName];
}
exports.getFieldValue = getFieldValue;

// Iterate over all defined fields of an object, including those missing
// or undefined, passing each field name and effective value (as returned
// by getFieldValue) to the callback. If the object has no corresponding
// Def, the callback will never be called.
exports.eachField = function(object, callback, context) {
    getFieldNames(object).forEach(function(name) {
        callback.call(this, name, getFieldValue(object, name));
    }, context);
};

// Similar to eachField, except that iteration stops as soon as the
// callback returns a truthy value. Like Array.prototype.some, the final
// result is either true or false to indicates whether the callback
// returned true for any element or not.
exports.someField = function(object, callback, context) {
    return getFieldNames(object).some(function(name) {
        return callback.call(this, name, getFieldValue(object, name));
    }, context);
};

// This property will be overridden as true by individual Def instances
// when they are finalized.
Object.defineProperty(Dp, "finalized", { value: false });

Dp.finalize = function() {
    // It's not an error to finalize a type more than once, but only the
    // first call to .finalize does anything.
    if (!this.finalized) {
        var allFields = this.allFields;
        var allSupertypes = this.allSupertypes;

        this.baseNames.forEach(function(name) {
            var def = defCache[name];
            def.finalize();
            extend(allFields, def.allFields);
            extend(allSupertypes, def.allSupertypes);
        });

        // TODO Warn if fields are overridden with incompatible types.
        extend(allFields, this.ownFields);
        allSupertypes[this.typeName] = this;

        this.fieldNames.length = 0;
        for (var fieldName in allFields) {
            if (hasOwn.call(allFields, fieldName) &&
                !allFields[fieldName].hidden) {
                this.fieldNames.push(fieldName);
            }
        }

        // Types are exported only once they have been finalized.
        Object.defineProperty(namedTypes, this.typeName, {
            enumerable: true,
            value: this.type
        });

        Object.defineProperty(this, "finalized", { value: true });

        // A linearization of the inheritance hierarchy.
        populateSupertypeList(this.typeName, this.supertypeList);
    }
};

function populateSupertypeList(typeName, list) {
    list.length = 0;
    list.push(typeName);

    var lastSeen = Object.create(null);

    for (var pos = 0; pos < list.length; ++pos) {
        typeName = list[pos];
        var d = defCache[typeName];
        assert.strictEqual(d.finalized, true);

        // If we saw typeName earlier in the breadth-first traversal,
        // delete the last-seen occurrence.
        if (hasOwn.call(lastSeen, typeName)) {
            delete list[lastSeen[typeName]];
        }

        // Record the new index of the last-seen occurrence of typeName.
        lastSeen[typeName] = pos;

        // Enqueue the base names of this type.
        list.push.apply(list, d.baseNames);
    }

    // Compaction loop to remove array holes.
    for (var to = 0, from = to, len = list.length; from < len; ++from) {
        if (hasOwn.call(list, from)) {
            list[to++] = list[from];
        }
    }

    list.length = to;
}

function extend(into, from) {
    Object.keys(from).forEach(function(name) {
        into[name] = from[name];
    });

    return into;
};

exports.finalize = function() {
    Object.keys(defCache).forEach(function(name) {
        defCache[name].finalize();
    });
};

},{"assert":1}],45:[function(require,module,exports){
var types = require("./lib/types");

// This core module of AST types captures ES5 as it is parsed today by
// git://github.com/ariya/esprima.git#master.
require("./def/core");

// Feel free to add to or remove from this list of extension modules to
// configure the precise type hierarchy that you need.
require("./def/es6");
require("./def/es7");
require("./def/mozilla");
require("./def/e4x");
require("./def/fb-harmony");

types.finalize();

exports.Type = types.Type;
exports.builtInTypes = types.builtInTypes;
exports.namedTypes = types.namedTypes;
exports.builders = types.builders;
exports.defineMethod = types.defineMethod;
exports.getFieldNames = types.getFieldNames;
exports.getFieldValue = types.getFieldValue;
exports.eachField = types.eachField;
exports.someField = types.someField;
exports.getSupertypeNames = types.getSupertypeNames;
exports.astNodesAreEquivalent = require("./lib/equiv");
exports.finalize = types.finalize;
exports.NodePath = require("./lib/node-path");
exports.PathVisitor = require("./lib/path-visitor");
exports.visit = exports.PathVisitor.visit;

},{"./def/core":32,"./def/e4x":33,"./def/es6":34,"./def/es7":35,"./def/fb-harmony":36,"./def/mozilla":37,"./lib/equiv":38,"./lib/node-path":39,"./lib/path-visitor":40,"./lib/types":44}],46:[function(require,module,exports){


/**
 * @version    0.2.1
 * @date       2015-01-31
 * @stability  2 - Unstable
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */


var hasOwn = Object.prototype.hasOwnProperty

function extend(obj, _super, extras) {
	obj.prototype = Object.create(_super.prototype)
	for (var key in extras) {
		obj.prototype[key] = extras[key]
	}
	obj.prototype.constructor = obj
}

function StyleMap(style) {
	var styleMap = this
	if (style) style.split(/\s*;\s*/g).map(function(val) {
		val = val.split(/\s*:\s*/)
		if(val[1]) styleMap[val[0]] = val[1]
	})
}

StyleMap.prototype.valueOf = function() {
	var styleMap = this
	return Object.keys(styleMap).map(function(key) {
		return key + ": " + styleMap[key]
	}).join("; ")
}

function Node(){}

function getSibling(node, step) {
	var silbings = node.parentNode && node.parentNode.childNodes
	, index = silbings && silbings.indexOf(node)

	return silbings && index > -1 && silbings[ index + step ] || null
}

Node.prototype = {
	nodeName:        null,
	parentNode:      null,
	ownerDocument:   null,
	childNodes:      null,
	get nodeValue() {
		return this.nodeType === 3 || this.nodeType === 8 ? this.data : null
	},
	set nodeValue(text) {
		return this.nodeType === 3 || this.nodeType === 8 ? (this.data = text) : null
	},
	get textContent() {
		return this.hasChildNodes() ? this.childNodes.map(function(child) {
			return child[ child.nodeType == 3 ? "data" : "textContent" ]
		}).join("") : this.nodeType === 3 ? this.data : ""
	},
	set textContent(text) {
		if (this.nodeType === 3) return this.data = text // jshint boss:true
		for (var node = this; node.firstChild;) node.removeChild(node.firstChild)
		node.appendChild(node.ownerDocument.createTextNode(text))
	},
	get firstChild() {
		return this.childNodes && this.childNodes[0] || null
	},
	get lastChild() {
		return this.childNodes && this.childNodes[ this.childNodes.length - 1 ] || null
	},
	get previousSibling() {
		return getSibling(this, -1)
	},
	get nextSibling() {
		return getSibling(this, 1)
	},
	get innerHTML() {
		return Node.prototype.toString.call(this)
	},
	get outerHTML() {
		return this.toString()
	},
	get htmlFor() {
		return this["for"]
	},
	set htmlFor(value) {
		this["for"] = value
	},
	get className() {
		return this["class"] || ""
	},
	set className(value) {
		this["class"] = value
	},
	get style() {
		return this.styleMap || (this.styleMap = new StyleMap())
	},
	set style(value) {
		this.styleMap = new StyleMap(value)
	},
	hasChildNodes: function() {
		return this.childNodes && this.childNodes.length > 0
	},
	appendChild: function(el) {
		return this.insertBefore(el)
	},
	insertBefore: function(el, ref) {
		var node = this
		, childs = node.childNodes

		if (el.nodeType == 11) {
			while (el.firstChild) node.insertBefore(el.firstChild, ref)
		} else {
			if (el.parentNode) el.parentNode.removeChild(el)
			el.parentNode = node

			// If ref is null, insert el at the end of the list of children.
			childs.splice(ref ? childs.indexOf(ref) : childs.length, 0, el)
		}
		return el
	},
	removeChild: function(el) {
		var node = this
		, index = node.childNodes.indexOf(el)
		if (index == -1) throw new Error("NOT_FOUND_ERR")

		node.childNodes.splice(index, 1)
		el.parentNode = null
		return el
	},
	replaceChild: function(el, ref) {
		this.insertBefore(el, ref)
		return this.removeChild(ref)
	},
	cloneNode: function(deep) {
		var key
		, node = this
		, clone = new node.constructor(node.tagName || node.data)
		clone.ownerDocument = node.ownerDocument

		if (node.hasAttribute) {
			for (key in node) if (node.hasAttribute(key)) clone[key] = node[key].valueOf()
		}

		if (deep && node.hasChildNodes()) {
			node.childNodes.forEach(function(child){
				clone.appendChild(child.cloneNode(deep))
			})
		}
		return clone
	},
	toString: function() {
		return this.hasChildNodes() ? this.childNodes.reduce(function(memo, node) {
			return memo + node
		}, "") : ""
	}
}


function DocumentFragment() {
	this.childNodes = []
}

extend(DocumentFragment, Node, {
	nodeType: 11,
	nodeName: "#document-fragment"
})

function Attribute(node, name) {
	this.name = name.toLowerCase()

	Object.defineProperty(this, "value", {
		get: function() {return node.getAttribute(name)},
		set: function(val) {node.setAttribute(name, val)}
	})
}
Attribute.prototype.toString = function() {
	if (!this.value) return this.name
	// jshint -W108
	return this.name + '="' + this.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"'
}

function HTMLElement(tag) {
	var element = this
	element.nodeName = element.tagName = tag.toUpperCase()
	element.localName = tag.toLowerCase()
	element.childNodes = []
}

var elRe = /([.#:[])([-\w]+)(?:=([-\w]+)])?]?/g

function findEl(node, sel, first) {
	var el
	, i = 0
	, out = []
	, rules = ["_"]
	, tag = sel.replace(elRe, function(_, o, s, v) {
		rules.push(
			o == "." ? "(' '+_.className+' ').indexOf(' "+s+" ')>-1" :
			o == "#" ? "_.id=='"+s+"'" :
			"_.getAttribute('"+s+"')"+(v?"=='"+v+"'":"")
		)
		return ""
	}) || "*"
	, els = node.getElementsByTagName(tag)
	, fn = Function("_", "return " + rules.join("&&")) // jshint evil:true

	// jshint -W084
	for (; el = els[i++]; ) if (fn(el)) {
		if (first) return el
		out.push(el)
	}
	return first ? null : out
}

/*
* Void elements:
* http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
*/
var voidElements = {
	AREA:1, BASE:1, BR:1, COL:1, EMBED:1, HR:1, IMG:1, INPUT:1,
	KEYGEN:1, LINK:1, MENUITEM:1, META:1, PARAM:1, SOURCE:1, TRACK:1, WBR:1
}

function escapeAttributeName(name) {
	name = name.toLowerCase()
	if (name === "constructor" || name === "attributes") return name.toUpperCase()
	return name
}

extend(HTMLElement, Node, {
	namespaceURI: "http://www.w3.org/1999/xhtml",
	nodeType: 1,
	localName: null,
	tagName: null,
	styleMap: null,
	hasAttribute: function(name) {
		name = escapeAttributeName(name)
		return name == "style" && !!this.style.valueOf() || hasOwn.call(this, name)
	},
	getAttribute: function(name) {
		name = escapeAttributeName(name)
		return this.hasAttribute(name) ? "" + this[name] : null
	},
	setAttribute: function(name, value) {
		name = escapeAttributeName(name)
		this[name] = "" + value
	},
	removeAttribute: function(name) {
		name = escapeAttributeName(name)
		this[name] = ""
		delete this[name]
	},
	getElementById: function(id) {
		if (this.id == id) return this
		for (var el, found, i = 0; !found && (el = this.childNodes[i++]);) {
			if (el.nodeType == 1) found = el.getElementById(id)
		}
		return found || null
	},
	getElementsByTagName: function(tag) {
		var el, els = [], next = this.firstChild
		tag = tag === "*" ? 1 : tag.toUpperCase()
		for (var i = 0, key = tag === 1 ? "nodeType" : "nodeName"; (el = next); ) {
			if (el[key] === tag) els[i++] = el
			next = el.firstChild || el.nextSibling
			while (!next && ((el = el.parentNode) !== this)) next = el.nextSibling
		}
		return els
	},
	querySelector: function(sel) {
		return findEl(this, sel, 1)
	},
	querySelectorAll: function(sel) {
		return findEl(this, sel)
	},
	toString: function() {
		var attrs = this.attributes.join(" ")
		return "<" + this.localName + (attrs ? " " + attrs : "") + ">" +
		(voidElements[this.tagName] ? "" : this.innerHTML + "</" + this.localName + ">" )
	}
})

Object.defineProperty(HTMLElement.prototype, "attributes", {
	get: function() {
		var key
		, attrs = []
		, element = this
		for (key in element) if (key === escapeAttributeName(key) && element.hasAttribute(key))
			attrs.push(new Attribute(element, escapeAttributeName(key)))
		return attrs
	}
})

function ElementNS(namespace, tag) {
	var element = this
	element.namespaceURI = namespace
	element.nodeName = element.tagName = element.localName = tag
	element.childNodes = []
}

ElementNS.prototype = HTMLElement.prototype

function Text(data) {
	this.data = data
}

extend(Text, Node, {
	nodeType: 3,
	nodeName: "#text",
	toString: function() {
		return ("" + this.data).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
	}
})

function Comment(data) {
	this.data = data
}

extend(Comment, Node, {
	nodeType: 8,
	nodeName: "#comment",
	toString: function() {
		return "<!--" + this.data + "-->"
	}
})

function Document() {
	this.childNodes = []
	this.documentElement = this.createElement("html")
	this.appendChild(this.documentElement)
	this.body = this.createElement("body")
	this.documentElement.appendChild(this.body)
}

function own(Element) {
	return function($1, $2) {
		var node = new Element($1, $2)
		node.ownerDocument = this
		return node
	}
}

extend(Document, Node, {
	nodeType: 9,
	nodeName: "#document",
	createElement: own(HTMLElement),
	createElementNS: own(ElementNS),
	createTextNode: own(Text),
	createComment: own(Comment),
	createDocumentFragment: own(DocumentFragment),
	getElementById: HTMLElement.prototype.getElementById,
	getElementsByTagName: HTMLElement.prototype.getElementsByTagName,
	querySelector: HTMLElement.prototype.querySelector,
	querySelectorAll: HTMLElement.prototype.querySelectorAll
})

module.exports = {
	document: new Document(),
	Document: Document,
	HTMLElement: HTMLElement
}


},{}],47:[function(require,module,exports){
/**
 * @module  get-doc
 */

var hasDom = require('has-dom');

module.exports = hasDom() ? document : null;
},{"has-dom":48}],48:[function(require,module,exports){
'use strict';
module.exports = function () {
	return typeof window !== 'undefined'
		&& typeof document !== 'undefined'
		&& typeof document.createElement === 'function';
};

},{}],49:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],50:[function(require,module,exports){
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

module.exports = function isPlainObject(o) {
  return !!o && typeof o === 'object' && o.constructor === Object;
};
},{}],51:[function(require,module,exports){
/**
 * @module  parse-attr
 */

//TODO: unpublish muparse

module.exports = require('./parse');
module.exports.stringify = require('./stringify');
},{"./parse":66,"./stringify":67}],52:[function(require,module,exports){
/**
 * @module each-csv
 */
module.exports = eachCSV;


var paren = require('parenthesis');


/** iterate over every item in string */
function eachCSV(str, fn){
	if (!str) return;

	//force string be primitive
	str += '';

	//escape parentheses
	var parens = paren.parse(str);

	var list = parens[0].split(/\s*,\s*/);

	for (var i = 0; i < list.length; i++) {
		fn(paren.stringify(list[i], parens), i);
	}
}
},{"parenthesis":53}],53:[function(require,module,exports){
/**
 * @module parenthesis
 */
module.exports = {
	parse: require('./parse'),
	stringify: require('./stringify')
};
},{"./parse":54,"./stringify":55}],54:[function(require,module,exports){
/**
 * @module  parenthesis/parse
 *
 * Parse a string with parenthesis.
 *
 * @param {string} str A string with parenthesis
 *
 * @return {Array} A list with parsed parens, where 0 is initial string.
 */

//TODO: implement sequential parser of this algorithm, compare performance.
module.exports = function(str, bracket){
	//pretend non-string parsed per-se
	if (typeof str !== 'string') return [str];

	var res = [], prevStr;

	bracket = bracket || '()';

	//create parenthesis regex
	var pRE = new RegExp(['\\', bracket[0], '[^\\', bracket[0], '\\', bracket[1], ']*\\', bracket[1]].join(''));

	function replaceToken(token, idx, str){
		//save token to res
		var refId = res.push(token.slice(1,-1));

		return '\\' + refId;
	}

	//replace paren tokens till there’s none
	while (str != prevStr) {
		prevStr = str;
		str = str.replace(pRE, replaceToken);
	}

	//save resulting str
	res.unshift(str);

	return res;
};
},{}],55:[function(require,module,exports){
/**
 * @module parenthesis/stringify
 *
 * Stringify an array/object with parenthesis references
 *
 * @param {Array|Object} arr An array or object where 0 is initial string
 *                           and every other key/value is reference id/value to replace
 *
 * @return {string} A string with inserted regex references
 */

//FIXME: circular references causes recursions here
//TODO: there’s possible a recursive version of this algorithm, so test it & compare
module.exports = function (str, refs, bracket){
	var prevStr;

	//pretend bad string stringified with no parentheses
	if (!str) return '';

	if (typeof str !== 'string') {
		bracket = refs;
		refs = str;
		str = refs[0];
	}

	bracket = bracket || '()';

	function replaceRef(token, idx, str){
		return bracket[0] + refs[token.slice(1)] + bracket[1];
	}

	while (str != prevStr) {
		prevStr = str;
		str = str.replace(/\\[0-9]+/, replaceRef);
	}

	return str;
};
},{}],56:[function(require,module,exports){
var lower = require('./lower');

//CamelCase → camel-case
module.exports = function(str){
	return str && str.replace(/[A-Z]/g, function(match, position){
		return (position ? '-' : '') + lower(match);
	});
};
},{"./lower":57}],57:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],58:[function(require,module,exports){
//speedy implementation of `in`
//NOTE: `!target[propName]` 2-3 orders faster than `!(propName in target)`
module.exports = function(a, b){
	if (!a) return false;

	//NOTE: this causes getter fire
	if (a[b]) return true;

	//FIXME: why in is better than hasOwnProperty? Something with prototypes. Show a case.
	return b in a;
	// return a.hasOwnProperty(b);
}

},{}],59:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],60:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'boolean' || a instanceof Boolean;
}
},{}],61:[function(require,module,exports){
module.exports = function(target){
	return typeof document !== 'undefined' && target instanceof HTMLElement;
};
},{}],62:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19}],63:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'number' || a instanceof Number;
}
},{}],64:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(o){
	// return obj === Object(obj);
	return !!o && typeof o === 'object' && o.constructor === Object;
};

},{}],65:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],66:[function(require,module,exports){
/**
 * @module  parse-attr/parse
 */

module.exports = parseAttr;


var eachCSV = require('each-csv');
var has = require('mutype/has');
var isArray = require('mutype/is-array');
var isString = require('mutype/is-string');
var isFn = require('mutype/is-fn');
var isNumber = require('mutype/is-number');
var isObject = require('mutype/is-object');
var isBool = require('mutype/is-bool');
var dashed = require('mustring/dashed');


//Export additional point-parsers
parseAttr.value = parseValue;
parseAttr.attribute = parseAttr;
parseAttr.typeBased = parseTyped;
parseAttr.object = parseObject;
parseAttr.list = parseList;



//parse attribute from the target
function parseAttr(target, name, exampleValue){
	var result;

	//parse attr value
	if (has(target, 'attributes')) {
		var dashedPropName = dashed(name);

		var attrs = target.attributes,
			attr = attrs[name] || attrs['data-' + name] || attrs[dashedPropName] || attrs['data-' + dashedPropName];

		if (attr) {
			var attrVal = attr.value;
			result = parseTyped(attrVal, exampleValue);
			return result;
		}
	}
}

//returns value from string with correct type except for array
//TODO: write tests for this fn
function parseValue(str){
	var v;
	// console.log('parse', str)
	if (/true/i.test(str)) {
		return true;
	} else if (/false/i.test(str)) {
		return false;
	} else if (/null/i.test(str)) {
		return null;
	} else if (/undefined/i.test(str)) {
		return undefined;
	} else if (/NaN/i.test(str)) {
		return NaN;
	} else if (!/[^\d\.\-]/.test(str) && !isNaN(v = parseFloat(str))) {
		return v;
	} else if (/^\[/.test(str) && /\]$/.test(str)) {
		return parseList(str);
	} else if (/^\{/.test(str) && /\}$/.test(str)){
		try {
			return JSON.parse(str);
		} catch (e) {
			return str;
		}
	}
	return str;
}

//parse value according to the type passed
function parseTyped(value, type){
	var res;
	// console.log('parse typed', value, type)
	if (isArray(type)) {
		res = parseList(value);
	} else if (isNumber(type)) {
		res = parseFloat(value);
	} else if (isBool(type)){
		res = !/^(false|off|0)$/.test(value);
	} else if (isFn(type)){
		res = value; //new Function(value);
	} else if (isString(type)){
		res = value;
	} else if (isObject(type)) {
		res = parseObject(value);
	} else {
		if (isString(value) && !value.length) res = true;
		else res = parseValue(value);
	}

	return res;
}

function parseObject(str){
	if (str[0] !== '{') str = '{' + str + '}';
	try {
		return JSON.parse(str);
	} catch (e) {
		return {};
	}
}

//returns array parsed from string
function parseList(str){
	if (!isString(str)) return [parseValue(str)];

	//clean str from spaces/array rudiments
	str = str.trim();
	if (str[0] === '[' && str[str.length - 1] === ']') str = str.slice(1,-1);


	var result = [];

	eachCSV(str, function(value) {
		result.push(parseValue(value));
	});

	return result;
}
},{"each-csv":52,"mustring/dashed":56,"mutype/has":58,"mutype/is-array":59,"mutype/is-bool":60,"mutype/is-fn":62,"mutype/is-number":63,"mutype/is-object":64,"mutype/is-string":65}],67:[function(require,module,exports){
/**
 * Stringify any element passed, useful for attribute setting
 *
 * @module muparse/stringify
 */

var isArray = require('mutype/is-array');
var isElement = require('mutype/is-element');
var isObject = require('mutype/is-object');
var isFn = require('mutype/is-fn');


module.exports = function stringify(el){
	if (!el) {
		return '' + el;
	} if (isArray(el)){
		//return comma-separated array
		return el.join(',');
	} else if (isElement(el)){
		//return id/name/proper selector
		return el.id;

		//that way is too heavy
		// return selector(el)
	} else if (isObject(el)){
		//serialize json
		return JSON.stringify(el);
	} else if (isFn(el)){
		//return fn body
		var src = el.toString();
		el.slice(src.indexOf('{') + 1, src.lastIndexOf('}'));
	} else {
		return el.toString();
	}
};
},{"mutype/is-array":59,"mutype/is-element":61,"mutype/is-fn":62,"mutype/is-object":64}],68:[function(require,module,exports){
/**
 * @module  queried/css4
 *
 * CSS4 query selector.
 */


var doc = require('get-doc');
var q = require('./lib/');


/**
 * Detect unsupported css4 features, polyfill them
 */

//detect `:scope`
try {
	doc.querySelector(':scope');
}
catch (e) {
	q.registerFilter('scope', require('./lib/pseudos/scope'));
}


//detect `:has`
try {
	doc.querySelector(':has');
}
catch (e) {
	q.registerFilter('has', require('./lib/pseudos/has'));

	//polyfilled :has requires artificial :not to make `:not(:has(...))`.
	q.registerFilter('not', require('./lib/pseudos/not'));
}


//detect `:root`
try {
	doc.querySelector(':root');
}
catch (e) {
	q.registerFilter('root', require('./lib/pseudos/root'));
}


//detect `:matches`
try {
	doc.querySelector(':matches');
}
catch (e) {
	q.registerFilter('matches', require('./lib/pseudos/matches'));
}


module.exports = q;
},{"./lib/":69,"./lib/pseudos/has":70,"./lib/pseudos/matches":71,"./lib/pseudos/not":72,"./lib/pseudos/root":73,"./lib/pseudos/scope":74,"get-doc":47}],69:[function(require,module,exports){
/**
 * A query engine (with no pseudo classes yet).
 *
 * @module queried/lib/index
 */

//TODO: jquery selectors
//TODO: test order of query result (should be compliant with querySelectorAll)
//TODO: third query param - include self
//TODO: .closest, .all, .next, .prev, .parent, .filter, .mathes etc methods - all with the same API: query(selector, [el], [incSelf], [within]).
//TODO: .all('.x', '.selector');
//TODO: use universal pseudo mapper/filter instead of separate ones.


var slice = require('sliced');
var unique = require('array-unique');
var getUid = require('get-uid');
var paren = require('parenthesis');
var isString = require('mutype/is-string');
var isArray = require('mutype/is-array');
var isArrayLike = require('mutype/is-array-like');
var arrayify = require('arrayify-compact');
var doc = require('get-doc');


/** Registered pseudos */
var pseudos = {};
var filters = {};
var mappers = {};


/** Regexp to grab pseudos with params */
var pseudoRE;


/**
 * Append a new filtering (classic) pseudo
 *
 * @param {string} name Pseudo name
 * @param {Function} filter A filtering function
 */
function registerFilter(name, filter, incSelf){
	if (pseudos[name]) return;

	//save pseudo filter
	pseudos[name] = filter;
	pseudos[name].includeSelf = incSelf;
	filters[name] = true;

	regenerateRegExp();
}


/**
 * Append a new mapping (relative-like) pseudo
 *
 * @param {string} name pseudo name
 * @param {Function} mapper map function
 */
function registerMapper(name, mapper, incSelf){
	if (pseudos[name]) return;

	pseudos[name] = mapper;
	pseudos[name].includeSelf = incSelf;
	mappers[name] = true;

	regenerateRegExp();
}


/** Update regexp catching pseudos */
function regenerateRegExp(){
	pseudoRE = new RegExp('::?(' + Object.keys(pseudos).join('|') + ')(\\\\[0-9]+)?');
}


/**
 * Query wrapper - main method to query elements.
 */
function queryMultiple(selector, el) {
	//ignore bad selector
	if (!selector) return [];

	//return elements passed as a selector unchanged (cover params case)
	if (!isString(selector)) return isArray(selector) ? selector : [selector];

	//catch polyfillable first `:scope` selector - just erase it, works just fine
	if (pseudos.scope) selector = selector.replace(/^\s*:scope/, '');

	//ignore non-queryable containers
	if (!el) el = [querySingle.document];

	//treat passed list
	else if (isArrayLike(el)) {
		el = arrayify(el);
	}

	//if element isn’t a node - make it q.document
	else if (!el.querySelector) {
		el = [querySingle.document];
	}

	//make any ok element a list
	else el = [el];

	return qPseudos(el, selector);
}


/** Query single element - no way better than return first of multiple selector */
function querySingle(selector, el){
	return queryMultiple(selector, el)[0];
}


/**
 * Return query result based off target list.
 * Parse and apply polyfilled pseudos
 */
function qPseudos(list, selector) {
	//ignore empty selector
	selector = selector.trim();
	if (!selector) return list;

	// console.group(selector);

	//scopify immediate children selector
	if (selector[0] === '>') {
		if (!pseudos.scope) {
			//scope as the first element in selector scopifies current element just ok
			selector = ':scope' + selector;
		}
		else {
			var id = getUid();
			list.forEach(function(el){el.setAttribute('__scoped', id);});
			selector = '[__scoped="' + id + '"]' + selector;
		}
	}

	var pseudo, pseudoFn, pseudoParam, pseudoParamId;

	//catch pseudo
	var parts = paren.parse(selector);
	var match = parts[0].match(pseudoRE);

	//if pseudo found
	if (match) {
		//grab pseudo details
		pseudo = match[1];
		pseudoParamId = match[2];

		if (pseudoParamId) {
			pseudoParam = paren.stringify(parts[pseudoParamId.slice(1)], parts);
		}

		//pre-select elements before pseudo
		var preSelector = paren.stringify(parts[0].slice(0, match.index), parts);

		//fix for query-relative
		if (!preSelector && !mappers[pseudo]) preSelector = '*';
		if (preSelector) list = qList(list, preSelector);


		//apply pseudo filter/mapper on the list
		pseudoFn = function(el) {return pseudos[pseudo](el, pseudoParam); };
		if (filters[pseudo]) {
			list = list.filter(pseudoFn);
		}
		else if (mappers[pseudo]) {
			list = unique(arrayify(list.map(pseudoFn)));
		}

		//shorten selector
		selector = parts[0].slice(match.index + match[0].length);

		// console.groupEnd();

		//query once again
		return qPseudos(list, paren.stringify(selector, parts));
	}

	//just query list
	else {
		// console.groupEnd();
		return qList(list, selector);
	}
}


/** Apply selector on a list of elements, no polyfilled pseudos */
function qList(list, selector){
	return unique(arrayify(list.map(function(el){
		return slice(el.querySelectorAll(selector));
	})));
}


/** Exports */
querySingle.all = queryMultiple;
querySingle.registerFilter = registerFilter;
querySingle.registerMapper = registerMapper;

/** Default document representative to use for DOM */
querySingle.document = doc;

module.exports = querySingle;
},{"array-unique":75,"arrayify-compact":76,"get-doc":47,"get-uid":78,"mutype/is-array":80,"mutype/is-array-like":79,"mutype/is-string":82,"parenthesis":83,"sliced":91}],70:[function(require,module,exports){
var q = require('..');

function has(el, subSelector){
	return !!q(subSelector, el);
}

module.exports = has;
},{"..":69}],71:[function(require,module,exports){
var q = require('..');

/** CSS4 matches */
function matches(el, selector){
	if (!el.parentNode) {
		var fragment = q.document.createDocumentFragment();
		fragment.appendChild(el);
	}

	return q.all(selector, el.parentNode).indexOf(el) > -1;
}

module.exports = matches;
},{"..":69}],72:[function(require,module,exports){
var matches = require('./matches');

function not(el, selector){
	return !matches(el, selector);
}

module.exports = not;
},{"./matches":71}],73:[function(require,module,exports){
var q = require('..');

module.exports = function root(el){
	return el === q.document.documentElement;
};
},{"..":69}],74:[function(require,module,exports){
/**
 * :scope pseudo
 * Return element if it has `scoped` attribute.
 *
 * @link http://dev.w3.org/csswg/selectors-4/#the-scope-pseudo
 */

module.exports = function scope(el){
	return el.hasAttribute('scoped');
};
},{}],75:[function(require,module,exports){
/*!
 * array-unique <https://github.com/jonschlinkert/array-unique>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }

  var len = arr.length;
  var i = -1;

  while (i++ < len) {
    var j = i + 1;

    for (; j < arr.length; ++j) {
      if (arr[i] === arr[j]) {
        arr.splice(j--, 1);
      }
    }
  }
  return arr;
};

},{}],76:[function(require,module,exports){
/*!
 * arrayify-compact <https://github.com/jonschlinkert/arrayify-compact>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';

var flatten = require('array-flatten');

module.exports = function(arr) {
  return flatten(!Array.isArray(arr) ? [arr] : arr)
    .filter(Boolean);
};

},{"array-flatten":77}],77:[function(require,module,exports){
/**
 * Recursive flatten function. Fastest implementation for array flattening.
 *
 * @param  {Array}  array
 * @param  {Array}  result
 * @param  {Number} depth
 * @return {Array}
 */
function flatten (array, result, depth) {
  for (var i = 0; i < array.length; i++) {
    if (depth > 0 && Array.isArray(array[i])) {
      flatten(array[i], result, depth - 1);
    } else {
      result.push(array[i]);
    }
  }

  return result;
}

/**
 * Flatten an array, with the ability to define a depth.
 *
 * @param  {Array}  array
 * @param  {Number} depth
 * @return {Array}
 */
module.exports = function (array, depth) {
  return flatten(array, [], depth || Infinity);
};

},{}],78:[function(require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],79:[function(require,module,exports){
var isString = require('./is-string');
var isArray = require('./is-array');
var isFn = require('./is-fn');

//FIXME: add tests from http://jsfiddle.net/ku9LS/1/
module.exports = function (a){
	return isArray(a) || (a && !isString(a) && !a.nodeType && (typeof window != 'undefined' ? a != window : true) && !isFn(a) && typeof a.length === 'number');
}
},{"./is-array":80,"./is-fn":81,"./is-string":82}],80:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],81:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19}],82:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],83:[function(require,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"./parse":84,"./stringify":85,"dup":53}],84:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],85:[function(require,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"dup":55}],86:[function(require,module,exports){
/** @module query-relative/closest */
var doc = require('get-doc');
var matches = require('queried/lib/pseudos/matches');
var isNode = require('mutype/is-node');


/**
* Get closest parent matching selector (or self)
*/
module.exports = function(e, q, checkSelf, within){
	if (!(isNode(e))) throw Error('Bad argument ' + e);

	within = within || doc;

	//root el is considered the topmost
	if (e === doc) return doc.documentElement;

	if (checkSelf) {
		if (!q || (isNode(q) ? e == q : matches(e, q))) return e;
	}

	while ((e = e.parentNode) && e !== doc) {
		if (!q || (isNode(q) ? e == q : matches(e, q))) return e;
	}
};
},{"get-doc":47,"mutype/is-node":89,"queried/lib/pseudos/matches":71}],87:[function(require,module,exports){
/**
 * @module query-relative
 */


//TODO: implement third, restricting argument, like jquery: closest(target, '.thing', within);


var q = require('queried');
var _closest = require('./closest');
var next = require('./next');
var prev = require('./prev');


var closest = function(el, selector){
	return _closest(el, selector, true);
};

var parent = function(el, selector){
	return _closest(el, selector, false);
};


/**
 * Register special transform-pseudos and provide static methods for them
 */
q.registerMapper('next', function(el, selector){
	return next(el, selector);
});

q.registerMapper('prev', function(el, selector){
	return prev(el, selector);
});

q.registerMapper('parent', parent);

q.registerMapper('closest', closest);


/** Export statics */
q.closest = closest;
q.parent = parent;
q.next = next;
q.prev = prev;

/** Wrapper forces to include self, always */
module.exports = q;
},{"./closest":86,"./next":88,"./prev":90,"queried":68}],88:[function(require,module,exports){
/** @module query-relative/next */
var matches = require('queried/lib/pseudos/matches');
var isNode = require('mutype/is-node');

/**
 * Find next sibling matching selector
 */
module.exports = function(e, q){
	if (!isNode(e)) throw Error('Bad argument ' + e);

	while (e = e.nextSibling) {
		if (e.nodeType === 1 && (!q || (isNode(q) ? e === q : matches(e, q)))) return e;
	}
};
},{"mutype/is-node":89,"queried/lib/pseudos/matches":71}],89:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],90:[function(require,module,exports){
/** @module query-relative/prev */
var matches = require('queried/lib/pseudos/matches');
var isNode = require('mutype/is-node');

/**
 * Find prev sibling matching selector
 */
module.exports = function(e, q){
	if (!(isNode(e))) throw Error('Bad argument ' + e);

	while (e = e.previousSibling) {
		if (e.nodeType === 1 && (!q || (isNode(q) ? e === q : matches(e, q)))) return e;
	}
};
},{"mutype/is-node":89,"queried/lib/pseudos/matches":71}],91:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"./lib/sliced":92,"dup":22}],92:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],93:[function(require,module,exports){
/*
  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true plusplus:true */
/*global esprima:true, define:true, exports:true, window: true,
throwErrorTolerant: true,
throwError: true, generateStatement: true, peek: true,
parseAssignmentExpression: true, parseBlock: true, parseExpression: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseFunctionSourceElements: true, parseVariableIdentifier: true,
parseLeftHandSideExpression: true,
parseUnaryExpression: true,
parseStatement: true, parseSourceElement: true */

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PropertyKind,
        Messages,
        Regex,
        SyntaxTreeDelegate,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        length,
        delegate,
        lookahead,
        state,
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken:  'Unexpected token %0',
        UnexpectedNumber:  'Unexpected number',
        UnexpectedString:  'Unexpected string',
        UnexpectedIdentifier:  'Unexpected identifier',
        UnexpectedReserved:  'Unexpected reserved word',
        UnexpectedEOS:  'Unexpected end of input',
        NewlineAfterThrow:  'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp:  'Invalid regular expression: missing /',
        InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
        InvalidLHSInForIn:  'Invalid left-hand side in for-in',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally:  'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith:  'Strict mode code may not include a with statement',
        StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
        StrictVarName:  'Variable name may not be eval or arguments in strict mode',
        StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
        StrictDelete:  'Delete of an unqualified identifier in strict mode.',
        StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
        AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
        AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
        StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord:  'Use of future reserved word in strict mode'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
        NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 48 && ch <= 57);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }


    // 7.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }

        // 'const' is specialized as Keyword in V8.
        // 'yield' and 'let' are for compatiblity with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // 7.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment, attacher;

        assert(typeof start === 'number', 'Comment must have valid position');

        // Because the way the actual token is scanned, often the comments
        // (if any) are skipped twice during the lexical analysis.
        // Thus, we need to skip adding a comment if the comment array already
        // handled it.
        if (state.lastCommentStart >= start) {
            return;
        }
        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
    }

    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;

        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                ++index;
                lineStart = index;
                if (index >= length) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            } else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    function skipComment() {
        var ch, start;

        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            } else if (ch === 0x2F) { // U+002F is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                } else if (ch === 0x2A) {  // U+002A is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else if (start && ch === 0x2D) { // U+002D is '-'
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                } else {
                    break;
                }
            } else if (ch === 0x3C) { // U+003C is '<'
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function getEscapedIdentifier() {
        var ch, id;

        ch = source.charCodeAt(index++);
        id = String.fromCharCode(ch);

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (ch === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            ++index;
            ch = scanHexEscape('u');
            if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
            id = ch;
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (!isIdentifierPart(ch)) {
                break;
            }
            ++index;
            id += String.fromCharCode(ch);

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (ch === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                ++index;
                ch = scanHexEscape('u');
                if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getEscapedIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }


    // 7.7 Punctuators

    function scanPunctuator() {
        var start = index,
            code = source.charCodeAt(index),
            code2,
            ch1 = source[index],
            ch2,
            ch3,
            ch4;

        switch (code) {

        // Check for most common single-character punctuators.
        case 0x2E:  // . dot
        case 0x28:  // ( open bracket
        case 0x29:  // ) close bracket
        case 0x3B:  // ; semicolon
        case 0x2C:  // , comma
        case 0x7B:  // { open curly brace
        case 0x7D:  // } close curly brace
        case 0x5B:  // [
        case 0x5D:  // ]
        case 0x3A:  // :
        case 0x3F:  // ?
        case 0x7E:  // ~
            ++index;
            if (extra.tokenize) {
                if (code === 0x28) {
                    extra.openParenToken = extra.tokens.length;
                } else if (code === 0x7B) {
                    extra.openCurlyToken = extra.tokens.length;
                }
            }
            return {
                type: Token.Punctuator,
                value: String.fromCharCode(code),
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };

        default:
            code2 = source.charCodeAt(index + 1);

            // '=' (U+003D) marks an assignment or comparison operator.
            if (code2 === 0x3D) {
                switch (code) {
                case 0x2B:  // +
                case 0x2D:  // -
                case 0x2F:  // /
                case 0x3C:  // <
                case 0x3E:  // >
                case 0x5E:  // ^
                case 0x7C:  // |
                case 0x25:  // %
                case 0x26:  // &
                case 0x2A:  // *
                    index += 2;
                    return {
                        type: Token.Punctuator,
                        value: String.fromCharCode(code) + String.fromCharCode(code2),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        start: start,
                        end: index
                    };

                case 0x21: // !
                case 0x3D: // =
                    index += 2;

                    // !== and ===
                    if (source.charCodeAt(index) === 0x3D) {
                        ++index;
                    }
                    return {
                        type: Token.Punctuator,
                        value: source.slice(start, index),
                        lineNumber: lineNumber,
                        lineStart: lineStart,
                        start: start,
                        end: index
                    };
                }
            }
        }

        // 4-character punctuator: >>>=

        ch4 = source.substr(index, 4);

        if (ch4 === '>>>=') {
            index += 4;
            return {
                type: Token.Punctuator,
                value: ch4,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        // 3-character punctuators: === !== >>> <<= >>=

        ch3 = ch4.substr(0, 3);

        if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: ch3,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        // Other 2-character punctuators: ++ -- << >> && ||
        ch2 = ch3.substr(0, 2);

        if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
            index += 2;
            return {
                type: Token.Punctuator,
                value: ch2,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        // 1-character punctuators: < > = ! + - * % & | ^ /
        if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
    }

    // 7.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanOctalLiteral(start) {
        var number = '0' + source[index++];
        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: true,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (isOctalDigit(ch)) {
                    return scanOctalLiteral(start);
                }

                // decimal number starts with '0' such as '09' is illegal.
                if (ch && isDecimalDigit(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // 7.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false, startLineNumber, startLineStart;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'u':
                    case 'x':
                        restore = index;
                        unescaped = scanHexEscape(ch);
                        if (unescaped) {
                            str += unescaped;
                        } else {
                            index = restore;
                            str += ch;
                        }
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            code = '01234567'.indexOf(ch);

                            // \0 is not octal escape sequence
                            if (code !== 0) {
                                octal = true;
                            }

                            if (index < length && isOctalDigit(source[index])) {
                                octal = true;
                                code = code * 8 + '01234567'.indexOf(source[index++]);

                                // 3 digits are only allowed when string starts
                                // with 0, 1, 2, 3
                                if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                    code = code * 8 + '01234567'.indexOf(source[index++]);
                                }
                            }
                            str += String.fromCharCode(code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch ===  '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            startLineNumber: startLineNumber,
            startLineStart: startLineStart,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function testRegExp(pattern, flags) {
        var value;
        try {
            value = new RegExp(pattern, flags);
        } catch (e) {
            throwError({}, Messages.InvalidRegExp);
        }
        return value;
    }

    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;

        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwError({}, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                throwError({}, Messages.UnterminatedRegExp);
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                }
            }
        }

        if (!terminated) {
            throwError({}, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }

    function scanRegExpFlags() {
        var ch, str, flags, restore;

        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
                } else {
                    str += '\\';
                    throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        return {
            value: flags,
            literal: str
        };
    }

    function scanRegExp() {
        var start, body, flags, pattern, value;

        lookahead = null;
        skipComment();
        start = index;

        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);

        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        return {
            literal: body.literal + flags.literal,
            value: value,
            start: start,
            end: index
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advanceSlash() {
        var prevToken,
            checkToken;
        // Using the following algorithm:
        // https://github.com/mozilla/sweet.js/wiki/design
        prevToken = extra.tokens[extra.tokens.length - 1];
        if (!prevToken) {
            // Nothing before that: it cannot be a division.
            return collectRegex();
        }
        if (prevToken.type === 'Punctuator') {
            if (prevToken.value === ']') {
                return scanPunctuator();
            }
            if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken &&
                        checkToken.type === 'Keyword' &&
                        (checkToken.value === 'if' ||
                         checkToken.value === 'while' ||
                         checkToken.value === 'for' ||
                         checkToken.value === 'with')) {
                    return collectRegex();
                }
                return scanPunctuator();
            }
            if (prevToken.value === '}') {
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                if (extra.tokens[extra.openCurlyToken - 3] &&
                        extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                    // Anonymous function.
                    checkToken = extra.tokens[extra.openCurlyToken - 4];
                    if (!checkToken) {
                        return scanPunctuator();
                    }
                } else if (extra.tokens[extra.openCurlyToken - 4] &&
                        extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                    // Named function.
                    checkToken = extra.tokens[extra.openCurlyToken - 5];
                    if (!checkToken) {
                        return collectRegex();
                    }
                } else {
                    return scanPunctuator();
                }
                // checkToken determines whether the function is
                // a declaration or an expression.
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                    // It is an expression.
                    return scanPunctuator();
                }
                // It is a declaration.
                return collectRegex();
            }
            return collectRegex();
        }
        if (prevToken.type === 'Keyword' && prevToken.value !== 'this') {
            return collectRegex();
        }
        return scanPunctuator();
    }

    function advance() {
        var ch;

        skipComment();

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        ch = source.charCodeAt(index);

        if (isIdentifierStart(ch)) {
            return scanIdentifier();
        }

        // Very common: ( and ) and ;
        if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (ch === 0x27 || ch === 0x22) {
            return scanStringLiteral();
        }


        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (ch === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && ch === 0x2F) {
            return advanceSlash();
        }

        return scanPunctuator();
    }

    function collectToken() {
        var loc, token, range, value;

        skipComment();
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            extra.tokens.push({
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            });
        }

        return token;
    }

    function lex() {
        var token;

        token = lookahead;
        index = token.end;
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();

        index = token.end;
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;

        return token;
    }

    function peek() {
        var pos, line, start;

        pos = index;
        line = lineNumber;
        start = lineStart;
        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        index = pos;
        lineNumber = line;
        lineStart = start;
    }

    function Position(line, column) {
        this.line = line;
        this.column = column;
    }

    function SourceLocation(startLine, startColumn, line, column) {
        this.start = new Position(startLine, startColumn);
        this.end = new Position(line, column);
    }

    SyntaxTreeDelegate = {

        name: 'SyntaxTree',

        processComment: function (node) {
            var lastChild, trailingComments;

            if (node.type === Syntax.Program) {
                if (node.body.length > 0) {
                    return;
                }
            }

            if (extra.trailingComments.length > 0) {
                if (extra.trailingComments[0].range[0] >= node.range[1]) {
                    trailingComments = extra.trailingComments;
                    extra.trailingComments = [];
                } else {
                    extra.trailingComments.length = 0;
                }
            } else {
                if (extra.bottomRightStack.length > 0 &&
                        extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments &&
                        extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments[0].range[0] >= node.range[1]) {
                    trailingComments = extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments;
                    delete extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments;
                }
            }

            // Eating the stack.
            while (extra.bottomRightStack.length > 0 && extra.bottomRightStack[extra.bottomRightStack.length - 1].range[0] >= node.range[0]) {
                lastChild = extra.bottomRightStack.pop();
            }

            if (lastChild) {
                if (lastChild.leadingComments && lastChild.leadingComments[lastChild.leadingComments.length - 1].range[1] <= node.range[0]) {
                    node.leadingComments = lastChild.leadingComments;
                    delete lastChild.leadingComments;
                }
            } else if (extra.leadingComments.length > 0 && extra.leadingComments[extra.leadingComments.length - 1].range[1] <= node.range[0]) {
                node.leadingComments = extra.leadingComments;
                extra.leadingComments = [];
            }


            if (trailingComments) {
                node.trailingComments = trailingComments;
            }

            extra.bottomRightStack.push(node);
        },

        markEnd: function (node, startToken) {
            if (extra.range) {
                node.range = [startToken.start, index];
            }
            if (extra.loc) {
                node.loc = new SourceLocation(
                    startToken.startLineNumber === undefined ?  startToken.lineNumber : startToken.startLineNumber,
                    startToken.start - (startToken.startLineStart === undefined ?  startToken.lineStart : startToken.startLineStart),
                    lineNumber,
                    index - lineStart
                );
                this.postProcess(node);
            }

            if (extra.attachComment) {
                this.processComment(node);
            }
            return node;
        },

        postProcess: function (node) {
            if (extra.source) {
                node.loc.source = extra.source;
            }
            return node;
        },

        createArrayExpression: function (elements) {
            return {
                type: Syntax.ArrayExpression,
                elements: elements
            };
        },

        createAssignmentExpression: function (operator, left, right) {
            return {
                type: Syntax.AssignmentExpression,
                operator: operator,
                left: left,
                right: right
            };
        },

        createBinaryExpression: function (operator, left, right) {
            var type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression :
                        Syntax.BinaryExpression;
            return {
                type: type,
                operator: operator,
                left: left,
                right: right
            };
        },

        createBlockStatement: function (body) {
            return {
                type: Syntax.BlockStatement,
                body: body
            };
        },

        createBreakStatement: function (label) {
            return {
                type: Syntax.BreakStatement,
                label: label
            };
        },

        createCallExpression: function (callee, args) {
            return {
                type: Syntax.CallExpression,
                callee: callee,
                'arguments': args
            };
        },

        createCatchClause: function (param, body) {
            return {
                type: Syntax.CatchClause,
                param: param,
                body: body
            };
        },

        createConditionalExpression: function (test, consequent, alternate) {
            return {
                type: Syntax.ConditionalExpression,
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        },

        createContinueStatement: function (label) {
            return {
                type: Syntax.ContinueStatement,
                label: label
            };
        },

        createDebuggerStatement: function () {
            return {
                type: Syntax.DebuggerStatement
            };
        },

        createDoWhileStatement: function (body, test) {
            return {
                type: Syntax.DoWhileStatement,
                body: body,
                test: test
            };
        },

        createEmptyStatement: function () {
            return {
                type: Syntax.EmptyStatement
            };
        },

        createExpressionStatement: function (expression) {
            return {
                type: Syntax.ExpressionStatement,
                expression: expression
            };
        },

        createForStatement: function (init, test, update, body) {
            return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
            };
        },

        createForInStatement: function (left, right, body) {
            return {
                type: Syntax.ForInStatement,
                left: left,
                right: right,
                body: body,
                each: false
            };
        },

        createFunctionDeclaration: function (id, params, defaults, body) {
            return {
                type: Syntax.FunctionDeclaration,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: null,
                generator: false,
                expression: false
            };
        },

        createFunctionExpression: function (id, params, defaults, body) {
            return {
                type: Syntax.FunctionExpression,
                id: id,
                params: params,
                defaults: defaults,
                body: body,
                rest: null,
                generator: false,
                expression: false
            };
        },

        createIdentifier: function (name) {
            return {
                type: Syntax.Identifier,
                name: name
            };
        },

        createIfStatement: function (test, consequent, alternate) {
            return {
                type: Syntax.IfStatement,
                test: test,
                consequent: consequent,
                alternate: alternate
            };
        },

        createLabeledStatement: function (label, body) {
            return {
                type: Syntax.LabeledStatement,
                label: label,
                body: body
            };
        },

        createLiteral: function (token) {
            return {
                type: Syntax.Literal,
                value: token.value,
                raw: source.slice(token.start, token.end)
            };
        },

        createMemberExpression: function (accessor, object, property) {
            return {
                type: Syntax.MemberExpression,
                computed: accessor === '[',
                object: object,
                property: property
            };
        },

        createNewExpression: function (callee, args) {
            return {
                type: Syntax.NewExpression,
                callee: callee,
                'arguments': args
            };
        },

        createObjectExpression: function (properties) {
            return {
                type: Syntax.ObjectExpression,
                properties: properties
            };
        },

        createPostfixExpression: function (operator, argument) {
            return {
                type: Syntax.UpdateExpression,
                operator: operator,
                argument: argument,
                prefix: false
            };
        },

        createProgram: function (body) {
            return {
                type: Syntax.Program,
                body: body
            };
        },

        createProperty: function (kind, key, value) {
            return {
                type: Syntax.Property,
                key: key,
                value: value,
                kind: kind
            };
        },

        createReturnStatement: function (argument) {
            return {
                type: Syntax.ReturnStatement,
                argument: argument
            };
        },

        createSequenceExpression: function (expressions) {
            return {
                type: Syntax.SequenceExpression,
                expressions: expressions
            };
        },

        createSwitchCase: function (test, consequent) {
            return {
                type: Syntax.SwitchCase,
                test: test,
                consequent: consequent
            };
        },

        createSwitchStatement: function (discriminant, cases) {
            return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant,
                cases: cases
            };
        },

        createThisExpression: function () {
            return {
                type: Syntax.ThisExpression
            };
        },

        createThrowStatement: function (argument) {
            return {
                type: Syntax.ThrowStatement,
                argument: argument
            };
        },

        createTryStatement: function (block, guardedHandlers, handlers, finalizer) {
            return {
                type: Syntax.TryStatement,
                block: block,
                guardedHandlers: guardedHandlers,
                handlers: handlers,
                finalizer: finalizer
            };
        },

        createUnaryExpression: function (operator, argument) {
            if (operator === '++' || operator === '--') {
                return {
                    type: Syntax.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true
                };
            }
            return {
                type: Syntax.UnaryExpression,
                operator: operator,
                argument: argument,
                prefix: true
            };
        },

        createVariableDeclaration: function (declarations, kind) {
            return {
                type: Syntax.VariableDeclaration,
                declarations: declarations,
                kind: kind
            };
        },

        createVariableDeclarator: function (id, init) {
            return {
                type: Syntax.VariableDeclarator,
                id: id,
                init: init
            };
        },

        createWhileStatement: function (test, body) {
            return {
                type: Syntax.WhileStatement,
                test: test,
                body: body
            };
        },

        createWithStatement: function (object, body) {
            return {
                type: Syntax.WithStatement,
                object: object,
                body: body
            };
        }
    };

    // Return true if there is a line terminator before the next token.

    function peekLineTerminator() {
        var pos, line, start, found;

        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;

        return found;
    }

    // Throw an exception

    function throwError(token, messageFormat) {
        var error,
            args = Array.prototype.slice.call(arguments, 2),
            msg = messageFormat.replace(
                /%(\d)/g,
                function (whole, index) {
                    assert(index < args.length, 'Message reference must be in range');
                    return args[index];
                }
            );

        if (typeof token.lineNumber === 'number') {
            error = new Error('Line ' + token.lineNumber + ': ' + msg);
            error.index = token.start;
            error.lineNumber = token.lineNumber;
            error.column = token.start - lineStart + 1;
        } else {
            error = new Error('Line ' + lineNumber + ': ' + msg);
            error.index = index;
            error.lineNumber = lineNumber;
            error.column = index - lineStart + 1;
        }

        error.description = msg;
        throw error;
    }

    function throwErrorTolerant() {
        try {
            throwError.apply(null, arguments);
        } catch (e) {
            if (extra.errors) {
                extra.errors.push(e);
            } else {
                throw e;
            }
        }
    }


    // Throw an exception because of the token.

    function throwUnexpected(token) {
        if (token.type === Token.EOF) {
            throwError(token, Messages.UnexpectedEOS);
        }

        if (token.type === Token.NumericLiteral) {
            throwError(token, Messages.UnexpectedNumber);
        }

        if (token.type === Token.StringLiteral) {
            throwError(token, Messages.UnexpectedString);
        }

        if (token.type === Token.Identifier) {
            throwError(token, Messages.UnexpectedIdentifier);
        }

        if (token.type === Token.Keyword) {
            if (isFutureReservedWord(token.value)) {
                throwError(token, Messages.UnexpectedReserved);
            } else if (strict && isStrictModeReservedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictReservedWord);
                return;
            }
            throwError(token, Messages.UnexpectedToken, token.value);
        }

        // BooleanLiteral, NullLiteral, or Punctuator.
        throwError(token, Messages.UnexpectedToken, token.value);
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpected(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        var line;

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(index) === 0x3B || match(';')) {
            lex();
            return;
        }

        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            return;
        }

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpected(lookahead);
        }
    }

    // Return true if provided expression is LeftHandSideExpression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [], startToken;

        startToken = lookahead;
        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                elements.push(parseAssignmentExpression());

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return delegate.markEnd(delegate.createArrayExpression(elements), startToken);
    }

    // 11.1.5 Object Initialiser

    function parsePropertyFunction(param, first) {
        var previousStrict, body, startToken;

        previousStrict = strict;
        startToken = lookahead;
        body = parseFunctionSourceElements();
        if (first && strict && isRestrictedWord(param[0].name)) {
            throwErrorTolerant(first, Messages.StrictParamName);
        }
        strict = previousStrict;
        return delegate.markEnd(delegate.createFunctionExpression(null, param, [], body), startToken);
    }

    function parseObjectPropertyKey() {
        var token, startToken;

        startToken = lookahead;
        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
            if (strict && token.octal) {
                throwErrorTolerant(token, Messages.StrictOctalLiteral);
            }
            return delegate.markEnd(delegate.createLiteral(token), startToken);
        }

        return delegate.markEnd(delegate.createIdentifier(token.value), startToken);
    }

    function parseObjectProperty() {
        var token, key, id, value, param, startToken;

        token = lookahead;
        startToken = lookahead;

        if (token.type === Token.Identifier) {

            id = parseObjectPropertyKey();

            // Property Assignment: Getter and Setter.

            if (token.value === 'get' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                expect(')');
                value = parsePropertyFunction([]);
                return delegate.markEnd(delegate.createProperty('get', key, value), startToken);
            }
            if (token.value === 'set' && !match(':')) {
                key = parseObjectPropertyKey();
                expect('(');
                token = lookahead;
                if (token.type !== Token.Identifier) {
                    expect(')');
                    throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
                    value = parsePropertyFunction([]);
                } else {
                    param = [ parseVariableIdentifier() ];
                    expect(')');
                    value = parsePropertyFunction(param, token);
                }
                return delegate.markEnd(delegate.createProperty('set', key, value), startToken);
            }
            expect(':');
            value = parseAssignmentExpression();
            return delegate.markEnd(delegate.createProperty('init', id, value), startToken);
        }
        if (token.type === Token.EOF || token.type === Token.Punctuator) {
            throwUnexpected(token);
        } else {
            key = parseObjectPropertyKey();
            expect(':');
            value = parseAssignmentExpression();
            return delegate.markEnd(delegate.createProperty('init', key, value), startToken);
        }
    }

    function parseObjectInitialiser() {
        var properties = [], property, name, key, kind, map = {}, toString = String, startToken;

        startToken = lookahead;

        expect('{');

        while (!match('}')) {
            property = parseObjectProperty();

            if (property.key.type === Syntax.Identifier) {
                name = property.key.name;
            } else {
                name = toString(property.key.value);
            }
            kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;

            key = '$' + name;
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                if (map[key] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                    } else if (kind !== PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    }
                } else {
                    if (kind === PropertyKind.Data) {
                        throwErrorTolerant({}, Messages.AccessorDataProperty);
                    } else if (map[key] & kind) {
                        throwErrorTolerant({}, Messages.AccessorGetSet);
                    }
                }
                map[key] |= kind;
            } else {
                map[key] = kind;
            }

            properties.push(property);

            if (!match('}')) {
                expect(',');
            }
        }

        expect('}');

        return delegate.markEnd(delegate.createObjectExpression(properties), startToken);
    }

    // 11.1.6 The Grouping Operator

    function parseGroupExpression() {
        var expr;

        expect('(');

        expr = parseExpression();

        expect(')');

        return expr;
    }


    // 11.1 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, startToken;

        if (match('(')) {
            return parseGroupExpression();
        }

        if (match('[')) {
            return parseArrayInitialiser();
        }

        if (match('{')) {
            return parseObjectInitialiser();
        }

        type = lookahead.type;
        startToken = lookahead;

        if (type === Token.Identifier) {
            expr =  delegate.createIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && lookahead.octal) {
                throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
            }
            expr = delegate.createLiteral(lex());
        } else if (type === Token.Keyword) {
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                expr = delegate.createThisExpression();
            } else {
                throwUnexpected(lex());
            }
        } else if (type === Token.BooleanLiteral) {
            token = lex();
            token.value = (token.value === 'true');
            expr = delegate.createLiteral(token);
        } else if (type === Token.NullLiteral) {
            token = lex();
            token.value = null;
            expr = delegate.createLiteral(token);
        } else if (match('/') || match('/=')) {
            if (typeof extra.tokens !== 'undefined') {
                expr = delegate.createLiteral(collectRegex());
            } else {
                expr = delegate.createLiteral(scanRegExp());
            }
            peek();
        } else {
            throwUnexpected(lex());
        }

        return delegate.markEnd(expr, startToken);
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [];

        expect('(');

        if (!match(')')) {
            while (index < length) {
                args.push(parseAssignmentExpression());
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token, startToken;

        startToken = lookahead;
        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpected(token);
        }

        return delegate.markEnd(delegate.createIdentifier(token.value), startToken);
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = parseExpression();

        expect(']');

        return expr;
    }

    function parseNewExpression() {
        var callee, args, startToken;

        startToken = lookahead;
        expectKeyword('new');
        callee = parseLeftHandSideExpression();
        args = match('(') ? parseArguments() : [];

        return delegate.markEnd(delegate.createNewExpression(callee, args), startToken);
    }

    function parseLeftHandSideExpressionAllowCall() {
        var previousAllowIn, expr, args, property, startToken;

        startToken = lookahead;

        previousAllowIn = state.allowIn;
        state.allowIn = true;
        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();
        state.allowIn = previousAllowIn;

        for (;;) {
            if (match('.')) {
                property = parseNonComputedMember();
                expr = delegate.createMemberExpression('.', expr, property);
            } else if (match('(')) {
                args = parseArguments();
                expr = delegate.createCallExpression(expr, args);
            } else if (match('[')) {
                property = parseComputedMember();
                expr = delegate.createMemberExpression('[', expr, property);
            } else {
                break;
            }
            delegate.markEnd(expr, startToken);
        }

        return expr;
    }

    function parseLeftHandSideExpression() {
        var previousAllowIn, expr, property, startToken;

        startToken = lookahead;

        previousAllowIn = state.allowIn;
        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();
        state.allowIn = previousAllowIn;

        while (match('.') || match('[')) {
            if (match('[')) {
                property = parseComputedMember();
                expr = delegate.createMemberExpression('[', expr, property);
            } else {
                property = parseNonComputedMember();
                expr = delegate.createMemberExpression('.', expr, property);
            }
            delegate.markEnd(expr, startToken);
        }

        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = parseLeftHandSideExpressionAllowCall();

        if (lookahead.type === Token.Punctuator) {
            if ((match('++') || match('--')) && !peekLineTerminator()) {
                // 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    throwErrorTolerant({}, Messages.StrictLHSPostfix);
                }

                if (!isLeftHandSide(expr)) {
                    throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
                }

                token = lex();
                expr = delegate.markEnd(delegate.createPostfixExpression(token.value, expr), startToken);
            }
        }

        return expr;
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                throwErrorTolerant({}, Messages.StrictLHSPrefix);
            }

            if (!isLeftHandSide(expr)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            expr = delegate.createUnaryExpression(token.value, expr);
            expr = delegate.markEnd(expr, startToken);
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            expr = delegate.createUnaryExpression(token.value, expr);
            expr = delegate.markEnd(expr, startToken);
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            expr = delegate.createUnaryExpression(token.value, expr);
            expr = delegate.markEnd(expr, startToken);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                throwErrorTolerant({}, Messages.StrictDelete);
            }
        } else {
            expr = parsePostfixExpression();
        }

        return expr;
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // 11.5 Multiplicative Operators
    // 11.6 Additive Operators
    // 11.7 Bitwise Shift Operators
    // 11.8 Relational Operators
    // 11.9 Equality Operators
    // 11.10 Binary Bitwise Operators
    // 11.11 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = parseUnaryExpression();

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = parseUnaryExpression();

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                expr = delegate.createBinaryExpression(operator, left, right);
                markers.pop();
                marker = markers[markers.length - 1];
                delegate.markEnd(expr, marker);
                stack.push(expr);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = parseUnaryExpression();
            stack.push(expr);
        }

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = delegate.createBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
            marker = markers.pop();
            delegate.markEnd(expr, marker);
        }

        return expr;
    }


    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = parseBinaryExpression();

        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = parseAssignmentExpression();

            expr = delegate.createConditionalExpression(expr, consequent, alternate);
            delegate.markEnd(expr, startToken);
        }

        return expr;
    }

    // 11.13 Assignment Operators

    function parseAssignmentExpression() {
        var token, left, right, node, startToken;

        token = lookahead;
        startToken = lookahead;

        node = left = parseConditionalExpression();

        if (matchAssign()) {
            // LeftHandSideExpression
            if (!isLeftHandSide(left)) {
                throwErrorTolerant({}, Messages.InvalidLHSInAssignment);
            }

            // 11.13.1
            if (strict && left.type === Syntax.Identifier && isRestrictedWord(left.name)) {
                throwErrorTolerant(token, Messages.StrictLHSAssignment);
            }

            token = lex();
            right = parseAssignmentExpression();
            node = delegate.markEnd(delegate.createAssignmentExpression(token.value, left, right), startToken);
        }

        return node;
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead;

        expr = parseAssignmentExpression();

        if (match(',')) {
            expr = delegate.createSequenceExpression([ expr ]);

            while (index < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expr.expressions.push(parseAssignmentExpression());
            }

            delegate.markEnd(expr, startToken);
        }

        return expr;
    }

    // 12.1 Block

    function parseStatementList() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseBlock() {
        var block, startToken;

        startToken = lookahead;
        expect('{');

        block = parseStatementList();

        expect('}');

        return delegate.markEnd(delegate.createBlockStatement(block), startToken);
    }

    // 12.2 Variable Statement

    function parseVariableIdentifier() {
        var token, startToken;

        startToken = lookahead;
        token = lex();

        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }

        return delegate.markEnd(delegate.createIdentifier(token.value), startToken);
    }

    function parseVariableDeclaration(kind) {
        var init = null, id, startToken;

        startToken = lookahead;
        id = parseVariableIdentifier();

        // 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            throwErrorTolerant({}, Messages.StrictVarName);
        }

        if (kind === 'const') {
            expect('=');
            init = parseAssignmentExpression();
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return delegate.markEnd(delegate.createVariableDeclarator(id, init), startToken);
    }

    function parseVariableDeclarationList(kind) {
        var list = [];

        do {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        } while (index < length);

        return list;
    }

    function parseVariableStatement() {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return delegate.createVariableDeclaration(declarations, 'var');
    }

    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations, startToken;

        startToken = lookahead;

        expectKeyword(kind);

        declarations = parseVariableDeclarationList(kind);

        consumeSemicolon();

        return delegate.markEnd(delegate.createVariableDeclaration(declarations, kind), startToken);
    }

    // 12.3 Empty Statement

    function parseEmptyStatement() {
        expect(';');
        return delegate.createEmptyStatement();
    }

    // 12.4 Expression Statement

    function parseExpressionStatement() {
        var expr = parseExpression();
        consumeSemicolon();
        return delegate.createExpressionStatement(expr);
    }

    // 12.5 If statement

    function parseIfStatement() {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return delegate.createIfStatement(test, consequent, alternate);
    }

    // 12.6 Iteration Statements

    function parseDoWhileStatement() {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return delegate.createDoWhileStatement(body, test);
    }

    function parseWhileStatement() {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return delegate.createWhileStatement(test, body);
    }

    function parseForVariableDeclaration() {
        var token, declarations, startToken;

        startToken = lookahead;
        token = lex();
        declarations = parseVariableDeclarationList();

        return delegate.markEnd(delegate.createVariableDeclaration(declarations, token.value), startToken);
    }

    function parseForStatement() {
        var init, test, update, left, right, body, oldInIteration;

        init = test = update = null;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var') || matchKeyword('let')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = true;

                if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            } else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = true;

                if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isLeftHandSide(init)) {
                        throwErrorTolerant({}, Messages.InvalidLHSInForIn);
                    }

                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }

            if (typeof left === 'undefined') {
                expect(';');
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                delegate.createForStatement(init, test, update, body) :
                delegate.createForInStatement(left, right, body);
    }

    // 12.7 The continue statement

    function parseContinueStatement() {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(index) === 0x3B) {
            lex();

            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return delegate.createContinueStatement(null);
        }

        if (peekLineTerminator()) {
            if (!state.inIteration) {
                throwError({}, Messages.IllegalContinue);
            }

            return delegate.createContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError({}, Messages.IllegalContinue);
        }

        return delegate.createContinueStatement(label);
    }

    // 12.8 The break statement

    function parseBreakStatement() {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(index) === 0x3B) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return delegate.createBreakStatement(null);
        }

        if (peekLineTerminator()) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError({}, Messages.IllegalBreak);
            }

            return delegate.createBreakStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError({}, Messages.IllegalBreak);
        }

        return delegate.createBreakStatement(label);
    }

    // 12.9 The return statement

    function parseReturnStatement() {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            throwErrorTolerant({}, Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(index) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(index + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return delegate.createReturnStatement(argument);
            }
        }

        if (peekLineTerminator()) {
            return delegate.createReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return delegate.createReturnStatement(argument);
    }

    // 12.10 The with statement

    function parseWithStatement() {
        var object, body;

        if (strict) {
            // TODO(ikarienator): Should we update the test cases instead?
            skipComment();
            throwErrorTolerant({}, Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return delegate.createWithStatement(object, body);
    }

    // 12.10 The swith statement

    function parseSwitchCase() {
        var test, consequent = [], statement, startToken;

        startToken = lookahead;
        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatement();
            consequent.push(statement);
        }

        return delegate.markEnd(delegate.createSwitchCase(test, consequent), startToken);
    }

    function parseSwitchStatement() {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return delegate.createSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (index < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError({}, Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return delegate.createSwitchStatement(discriminant, cases);
    }

    // 12.13 The throw statement

    function parseThrowStatement() {
        var argument;

        expectKeyword('throw');

        if (peekLineTerminator()) {
            throwError({}, Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return delegate.createThrowStatement(argument);
    }

    // 12.14 The try statement

    function parseCatchClause() {
        var param, body, startToken;

        startToken = lookahead;
        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpected(lookahead);
        }

        param = parseVariableIdentifier();
        // 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            throwErrorTolerant({}, Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return delegate.markEnd(delegate.createCatchClause(param, body), startToken);
    }

    function parseTryStatement() {
        var block, handlers = [], finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handlers.push(parseCatchClause());
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (handlers.length === 0 && !finalizer) {
            throwError({}, Messages.NoCatchOrFinally);
        }

        return delegate.createTryStatement(block, [], handlers, finalizer);
    }

    // 12.15 The debugger statement

    function parseDebuggerStatement() {
        expectKeyword('debugger');

        consumeSemicolon();

        return delegate.createDebuggerStatement();
    }

    // 12 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key,
            startToken;

        if (type === Token.EOF) {
            throwUnexpected(lookahead);
        }

        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }

        startToken = lookahead;

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return delegate.markEnd(parseEmptyStatement(), startToken);
            case '(':
                return delegate.markEnd(parseExpressionStatement(), startToken);
            default:
                break;
            }
        }

        if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return delegate.markEnd(parseBreakStatement(), startToken);
            case 'continue':
                return delegate.markEnd(parseContinueStatement(), startToken);
            case 'debugger':
                return delegate.markEnd(parseDebuggerStatement(), startToken);
            case 'do':
                return delegate.markEnd(parseDoWhileStatement(), startToken);
            case 'for':
                return delegate.markEnd(parseForStatement(), startToken);
            case 'function':
                return delegate.markEnd(parseFunctionDeclaration(), startToken);
            case 'if':
                return delegate.markEnd(parseIfStatement(), startToken);
            case 'return':
                return delegate.markEnd(parseReturnStatement(), startToken);
            case 'switch':
                return delegate.markEnd(parseSwitchStatement(), startToken);
            case 'throw':
                return delegate.markEnd(parseThrowStatement(), startToken);
            case 'try':
                return delegate.markEnd(parseTryStatement(), startToken);
            case 'var':
                return delegate.markEnd(parseVariableStatement(), startToken);
            case 'while':
                return delegate.markEnd(parseWhileStatement(), startToken);
            case 'with':
                return delegate.markEnd(parseWithStatement(), startToken);
            default:
                break;
            }
        }

        expr = parseExpression();

        // 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError({}, Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return delegate.markEnd(delegate.createLabeledStatement(expr, labeledBody), startToken);
        }

        consumeSemicolon();

        return delegate.markEnd(delegate.createExpressionStatement(expr), startToken);
    }

    // 13 Function Definition

    function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, startToken;

        startToken = lookahead;
        expect('{');

        while (index < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;

        while (index < length) {
            if (match('}')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;

        return delegate.markEnd(delegate.createBlockStatement(sourceElements), startToken);
    }

    function parseParams(firstRestricted) {
        var param, params = [], token, stricted, paramSet, key, message;
        expect('(');

        if (!match(')')) {
            paramSet = {};
            while (index < length) {
                token = lookahead;
                param = parseVariableIdentifier();
                key = '$' + token.value;
                if (strict) {
                    if (isRestrictedWord(token.value)) {
                        stricted = token;
                        message = Messages.StrictParamName;
                    }
                    if (Object.prototype.hasOwnProperty.call(paramSet, key)) {
                        stricted = token;
                        message = Messages.StrictParamDupe;
                    }
                } else if (!firstRestricted) {
                    if (isRestrictedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictParamName;
                    } else if (isStrictModeReservedWord(token.value)) {
                        firstRestricted = token;
                        message = Messages.StrictReservedWord;
                    } else if (Object.prototype.hasOwnProperty.call(paramSet, key)) {
                        firstRestricted = token;
                        message = Messages.StrictParamDupe;
                    }
                }
                params.push(param);
                paramSet[key] = true;
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return {
            params: params,
            stricted: stricted,
            firstRestricted: firstRestricted,
            message: message
        };
    }

    function parseFunctionDeclaration() {
        var id, params = [], body, token, stricted, tmp, firstRestricted, message, previousStrict, startToken;

        startToken = lookahead;

        expectKeyword('function');
        token = lookahead;
        id = parseVariableIdentifier();
        if (strict) {
            if (isRestrictedWord(token.value)) {
                throwErrorTolerant(token, Messages.StrictFunctionName);
            }
        } else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return delegate.markEnd(delegate.createFunctionDeclaration(id, params, [], body), startToken);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp, params = [], body, previousStrict, startToken;

        startToken = lookahead;
        expectKeyword('function');

        if (!match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    throwErrorTolerant(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwError(firstRestricted, message);
        }
        if (strict && stricted) {
            throwErrorTolerant(stricted, message);
        }
        strict = previousStrict;

        return delegate.markEnd(delegate.createFunctionExpression(id, params, [], body), startToken);
    }

    // 14 Program

    function parseSourceElement() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'const':
            case 'let':
                return parseConstLetDeclaration(lookahead.value);
            case 'function':
                return parseFunctionDeclaration();
            default:
                return parseStatement();
            }
        }

        if (lookahead.type !== Token.EOF) {
            return parseStatement();
        }
    }

    function parseSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;

        while (index < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (index < length) {
            sourceElement = parseSourceElement();
            /* istanbul ignore if */
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }

    function parseProgram() {
        var body, startToken;

        skipComment();
        peek();
        startToken = lookahead;
        strict = false;

        body = parseSourceElements();
        return delegate.markEnd(delegate.createProgram(body), startToken);
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function tokenize(code, options) {
        var toString,
            token,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        delegate = SyntaxTreeDelegate;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenize = true;
        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            token = lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    token = lex();
                } catch (lexError) {
                    token = lookahead;
                    if (extra.errors) {
                        extra.errors.push(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            filterTokenLocation();
            tokens = extra.tokens;
            if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
            }
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        delegate = SyntaxTreeDelegate;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
        };

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '1.2.3';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
   /* istanbul ignore next */
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],94:[function(require,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"dup":47,"has-dom":95}],95:[function(require,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"dup":48}],96:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"./lib/":97,"./lib/pseudos/has":98,"./lib/pseudos/matches":99,"./lib/pseudos/not":100,"./lib/pseudos/root":101,"./lib/pseudos/scope":102,"dup":68,"get-doc":106}],97:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"array-unique":103,"arrayify-compact":104,"dup":69,"get-doc":106,"get-uid":108,"mutype/is-array":110,"mutype/is-array-like":109,"mutype/is-string":112,"parenthesis":113,"sliced":116}],98:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"..":97,"dup":70}],99:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"..":97,"dup":71}],100:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"./matches":99,"dup":72}],101:[function(require,module,exports){
arguments[4][73][0].apply(exports,arguments)
},{"..":97,"dup":73}],102:[function(require,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"dup":74}],103:[function(require,module,exports){
arguments[4][75][0].apply(exports,arguments)
},{"dup":75}],104:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"array-flatten":105,"dup":76}],105:[function(require,module,exports){
arguments[4][77][0].apply(exports,arguments)
},{"dup":77}],106:[function(require,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"dup":47,"has-dom":107}],107:[function(require,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"dup":48}],108:[function(require,module,exports){
arguments[4][78][0].apply(exports,arguments)
},{"dup":78}],109:[function(require,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"./is-array":110,"./is-fn":111,"./is-string":112,"dup":79}],110:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],111:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19}],112:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],113:[function(require,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"./parse":114,"./stringify":115,"dup":53}],114:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],115:[function(require,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"dup":55}],116:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"./lib/sliced":117,"dup":22}],117:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],118:[function(require,module,exports){
/** @module query-relative/closest */
var doc = require('get-doc');
var matches = require('queried/lib/pseudos/matches');
var isNode = require('mutype/is-node');


/**
* Get closest parent matching selector (or self)
*/
module.exports = function(e, q, checkSelf, within){
	if (!(isNode(e))) throw Error('Bad argument ' + e);

	within = within || doc;

	//root el is considered the topmost
	if (e === doc) return doc.documentElement;
	if (checkSelf) {
		if (!q || (isNode(q) ? e == q : matches(e, q))) return e;
	}

	while ((e = e.parentNode) && e !== doc) {
		if (!q || (isNode(q) ? e == q : matches(e, q))) return e;
	}
};
},{"get-doc":94,"mutype/is-node":121,"queried/lib/pseudos/matches":99}],119:[function(require,module,exports){
arguments[4][87][0].apply(exports,arguments)
},{"./closest":118,"./next":120,"./prev":122,"dup":87,"queried":96}],120:[function(require,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"dup":88,"mutype/is-node":121,"queried/lib/pseudos/matches":99}],121:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],122:[function(require,module,exports){
arguments[4][90][0].apply(exports,arguments)
},{"dup":90,"mutype/is-node":121,"queried/lib/pseudos/matches":99}]},{},[6]);
