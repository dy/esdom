
var assert = require('chai').assert;
var esprima = require('esprima');
var escodegen = require('escodegen');
var esdom = require('..');
var doc = require('get-doc') || require('dom-lite').document;
var rfile = require('require-file');
var q = require('queried');


q.document = doc;

var containerEl = doc.createElement('div');
containerEl.id="ast";
doc.body.appendChild(containerEl);




describe('cases', function(){
	it.skip('TryStatement: guardedHandlers', function(){
		//TODO
	});
	it('Literal: empty string', function(){
		var src = 'var a = {\'\':\'\'}';
		var ast = esprima.parse(src);
		assert.deepEqual(ast, esdom.toAST(esdom.toDOM(ast)));
	});
});


describe('parse/serialize', function(){
	it('self', function(){
		var src = rfile('../index.js');

		var ast = esprima.parse(src);

		// console.log(ast);

		var el = esdom.toDOM(ast);
		// console.log(el);

		// console.log(el);

		// containerEl.appendChild(el);

		var reast = esdom.toAST(el);
		// console.log(reast)

		assert.deepEqual(ast, reast);
	});

	it('lodash', function(){
		var src = rfile('./case/lodash.min.js');

		this.timeout(10000);

		var ast = esprima.parse(src);

		// console.log(ast);

		var el = esdom.toDOM(ast);
		var reast = esdom.toAST(el);

		assert.deepEqual(ast, reast);

		//look up for statement
		// for (var i = 0; i < 67; i++) {
		// 	console.log(i);
		// 	assert.deepEqual(ast.body[1].expression.callee.object.body.body[12].body.body[i], reast.body[1].expression.callee.object.body.body[12].body.body[i]);
		// }
	});

	it.skip('jquery case', function(){
		var src = sources.jQueryMin;

		var ast = esprima.parse(src);
		var el = esdom.toDOM(ast);
	});

	it.skip('underscore case', function(){

	});

	it.skip('RequireJS case', function(){

	});

	it.skip('es6 case', function(){

	});
});


describe('analyze', function(){
	it.only('analyze self', function(){
		var src = rfile('./case/analysis.js');

		var ast = esprima.parse(src);

		// console.log(ast);

		var el = esdom.toDOM(ast);
		esdom.analyze(el);


		containerEl.appendChild(el);

		// console.log(q.all('[data-scope]', el));

		var reast = esdom.toAST(el);
		// console.log(reast)

		assert.deepEqual(ast, reast);
	});
});