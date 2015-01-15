var assert = require('assert');
var esprima = require('esprima');
var escodegen = require('escodegen');
var esdom = require('..');


var containerEl = document.querySelector('#ast');

//list of stringy sources of different libs
var sources = {
	jQuery: getFile('./jquery.js'),
	jQueryMin: getFile('./jquery.min.js')
};


describe('esdom tests', function(){
	it('simple case', function(){
		var src = [
			'function x(a, b, c){ 1; 2; 3; return a + b;}'
		].join('\n');

		var ast = esprima.parse(src);
		console.log(ast);
		var el = esdom.toDOM(ast);

		console.log(el);
		// containerEl.appendChild(el);

		var reast = esdom.toAST(el);
		console.log(reast)

		assert.deepEqual(ast, reast);
	});

	it.skip('jquery case', function(){

	});

	it.skip('jquery min case', function(){
		var src = sources.jQueryMin;

		var ast = esprima.parse(src);
		var el = esdom.toDOM(ast);
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


function getFile(path){

}