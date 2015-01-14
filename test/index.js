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
		var el = esdom(ast);

		console.log(el);
		containerEl.appendChild(el);

		var reast = esdom.parse(el);
		console.log(reast)

		assert.deepEqual(ast, reast);
	});


	it('getter on list properties');

	it('getter on node property')
});