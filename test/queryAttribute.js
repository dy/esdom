/**
 * Esquery queryAttribute tests
 *
 * https://github.com/estools/esquery/blob/master/tests/queryAttribute.js
 */
var assert = require('chai').assert;
var esprima = require('esprima');
var escodegen = require('escodegen');
var esdom = require('..');
var doc = require('dom-lite').document;
var rfile = require('require-file');
var q = require('../query');
q.document = doc;


var conditional = require("./fixture/conditional"),
	forLoop = require("./fixture/forLoop"),
	simpleFunction = require("./fixture/simpleFunction"),
	simpleProgram = require("./fixture/simpleProgram");



describe.skip("Attribute query", function(){

	it("conditional", function () {
		var matches = q("[name=\"x\"]", conditional);
		assert.include([
			conditional.body[0].test.left,
			conditional.body[0].alternate.body[0].expression.left,
			conditional.body[1].test.left.left.left,
			conditional.body[1].test.right
		], matches);

		matches = q("[callee.name=\"foo\"]", conditional);
		assert.include([
			conditional.body[0].consequent.body[0].expression
		], matches);

		matches = q("[operator]", conditional);
		assert.include([
			conditional.body[0].test,
			conditional.body[0].alternate.body[0].expression,
			conditional.body[1].test,
			conditional.body[1].test.left,
			conditional.body[1].test.left.left
		], matches);

		matches = q("[prefix=true]", conditional);
		assert.include([
			conditional.body[1].consequent.body[0].expression.right
		], matches);
	});

	it("for loop", function () {
		var matches = q("[operator=\"=\"]", forLoop);
		assert.include([
			forLoop.body[0].init
		], matches);

		matches = q("[object.name=\"foo\"]", forLoop);
		assert.include([
			forLoop.body[0].test.right
		], matches);

		matches = q("[operator]", forLoop);
		assert.include([
			forLoop.body[0].init,
			forLoop.body[0].test,
			forLoop.body[0].update
		], matches);
	});

	it("simple function", function () {
		var matches = q("[kind=\"var\"]", simpleFunction);
		assert.include([
			simpleFunction.body[0].body.body[0]
		], matches);

		matches = q("[id.name=\"foo\"]", simpleFunction);
		assert.include([
			simpleFunction.body[0]
		], matches);

		matches = q("[left]", simpleFunction);
		assert.include([
			simpleFunction.body[0].body.body[0].declarations[0].init
		], matches);
	});

	it("simple program", function () {
		var matches = q("[kind=\"var\"]", simpleProgram);
		assert.include([
			simpleProgram.body[0],
			simpleProgram.body[1]
		], matches);

		matches = q("[id.name=\"y\"]", simpleProgram);
		assert.include([
			simpleProgram.body[1].declarations[0]
		], matches);

		matches = q("[body]", simpleProgram);
		assert.include([
			simpleProgram,
			simpleProgram.body[3].consequent
		], matches);
	});

	it("conditional regexp", function () {
		var matches = q("[name=/x|foo/]", conditional);
		assert.include([
			conditional.body[0].test.left,
			conditional.body[0].consequent.body[0].expression.callee,
			conditional.body[0].alternate.body[0].expression.left
		], matches);
	});

	it("simple function regexp", function () {
		var matches = q("[name=/x|foo/]", simpleFunction);
		assert.include([
			simpleFunction.body[0].id,
			simpleFunction.body[0].params[0],
			simpleFunction.body[0].body.body[0].declarations[0].init.left
		], matches);
	});

	it("simple function numeric", function () {
		var matches = q("FunctionDeclaration[params.0.name=x]", simpleFunction);
		assert.include([
			simpleFunction.body[0]
		], matches);
	});

	it("simple program regexp", function () {
		var matches = q("[name=/[asdfy]/]", simpleProgram);
		assert.include([
			simpleProgram.body[1].declarations[0].id,
			simpleProgram.body[3].test,
			simpleProgram.body[3].consequent.body[0].expression.left
		], matches);
	});

	it("for loop regexp", function () {
		var matches = q("[name=/i|foo/]", forLoop);
		assert.include([
			forLoop.body[0].init.left,
			forLoop.body[0].test.left,
			forLoop.body[0].test.right.object,
			forLoop.body[0].update.argument,
			forLoop.body[0].body.body[0].expression.callee.object,
			forLoop.body[0].body.body[0].expression.callee.property
		], matches);
	});

	it("not string", function () {
		var matches = q('[name!="x"]', conditional);
		assert.include([
			conditional.body[0].consequent.body[0].expression.callee,
			conditional.body[1].consequent.body[0].expression.left
		], matches);
	});

	it("not type", function () {
		var matches = q('[value!=type(number)]', conditional);
		assert.include([
			conditional.body[1].test.left.left.right,
			conditional.body[1].test.left.right,
			conditional.body[1].alternate
		], matches);
	});

	it("not regexp", function () {
		var matches = q('[name!=/x|y/]', conditional);
		assert.include([
			conditional.body[0].consequent.body[0].expression.callee
		], matches);
	});

	it("less than", function () {
		var matches = q("[body.length<2]", conditional);
		assert.include([
			conditional.body[0].consequent,
			conditional.body[0].alternate,
			conditional.body[1].consequent,
			conditional.body[1].alternate.consequent
		], matches);
	});

	it("greater than", function () {
		var matches = q("[body.length>1]", conditional);
		assert.include([
			conditional
		], matches);
	});

	it("less than or equal", function () {
		var matches = q("[body.length<=2]", conditional);
		assert.include([
			conditional,
			conditional.body[0].consequent,
			conditional.body[0].alternate,
			conditional.body[1].consequent,
			conditional.body[1].alternate.consequent
		], matches);
	});

	it("greater than or equal", function () {
		var matches = q("[body.length>=1]", conditional);
		assert.include([
			conditional,
			conditional.body[0].consequent,
			conditional.body[0].alternate,
			conditional.body[1].consequent,
			conditional.body[1].alternate.consequent
		], matches);
	});

	it("attribute type", function () {
		var matches = q("[test=type(object)]", conditional);
		assert.include([
			conditional.body[0],
			conditional.body[1],
			conditional.body[1].alternate
		], matches);

		matches = q("[value=type(boolean)]", conditional);
		assert.include([
			conditional.body[1].test.left.right,
			conditional.body[1].alternate.test
		], matches);
	});
});