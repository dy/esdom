var esprima = require("esprima");

module.exports = esprima.parse("for (i = 0; i < foo.length; i++) { foo[i](); }");