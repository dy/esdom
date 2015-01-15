var assert = require('assert');
var esprima = require('esprima');
var escodegen = require('escodegen');
var esdom = require('..');


var containerEl = document.querySelector('#ast');


describe('esdom tests', function(){
	it('simple case', function(){
		var src = [
			'var x = 1;'
		].join('\n');

		var ast = esprima.parse(src);
		console.log(ast);
		var el = esdom.toDOM(ast);

		console.log(el);
		containerEl.appendChild(el);

		var reast = esdom.toAST(el);
		console.log(reast)

		assert.deepEqual(ast, reast);
	});

	it.skip('jquery case', function(){

	});

	it.skip('jquery min case', function(){

	});

	it.skip('underscore case', function(){

	});

	it.skip('lodash min case', function(){

	});

	it.skip('RequireJS case', function(){

	});

	it.skip('es6 case', function(){

	});
});