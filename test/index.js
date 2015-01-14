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
		var el = esdom(ast);
		containerEl.appendChild(el);

		var resrc = escodegen.generate(esdom.parse(el));

		assert.equal(src, resrc);
	});
});