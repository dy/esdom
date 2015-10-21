# esdom [![Build Status](https://travis-ci.org/dfcreative/esdom.svg?branch=master)](https://travis-ci.org/dfcreative/esdom) [![Code Climate](https://codeclimate.com/github/dfcreative/esdom/badges/gpa.svg)](https://codeclimate.com/github/dfcreative/esdom) <a href="UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="20"/></a>

#### [DEMO](http://dfcreative.github.io/esdom/)

Build up DOM from AST or AST from DOM. Just because DOM is something more familiar to web-developers than AST, though there are tools like [esquery](https://github.com/estools/esquery) or [ast-types](https://github.com/benjamin/ast-types).
ESDOM is forward-compatible with esquery, so everything is done via esdom can be painlessly refactored to use esquery.

Works both in browsers and node.


`$ npm install esdom`


```js
var esdom = require('esdom');
var esprima = require('esprima');
var escodegen = require('escodegen');

var ast = esprima.parse(code);

var el = esdom.toDOM(ast);
el.querySelector('Identifier').setAttribute('name', 'x');
ast = esdom.toAST(el);

escodegen.print(ast);
```


# Mapping nodes

Mapping is done to be compatible with [ESQuery selectors](https://github.com/estools/esquery) as much as possible.

Let’s take an examplary source:

```js
var a = 1;
```

AST for the source will be:

```json
{
	"type": "Program",
	"body": [
		{
			"type": "VariableDeclaration",
			"declarations": [
				{
					"type": "VariableDeclarator",
					"id": {
						"type": "Identifier",
						"name": "a"
					},
					"init": {
						"type": "Literal",
						"value": 1,
						"raw": "1"
					}
				}
			],
			"kind": "var"
		}
	]
}
```

And resulting HTML:

```html
<program class="Program Node Printable" type="Program" body="[]">
	<variabledeclaration class="VariableDeclaration Declaration Statement Node Printable" type="VariableDeclaration" declarations="[]" kind="var" prop="body">
		<variabledeclarator class="VariableDeclarator Node Printable" type="VariableDeclarator" id="Identifier" init="Literal" prop="declarations">
			<identifier class="Identifier Expression Pattern Node Printable" type="Identifier" name="a" prop="id"></identifier>
			<literal class="Literal Expression Pattern Node Printable" type="Literal" value="1" raw="1" prop="init"></literal>
		</variabledeclarator>
	</variabledeclaration>
</program>
```

So all esquery css selectors work just fine with that html, with some exceptions:

* `:first-child` and `:last-child` selectors always return non-empty result, where esquery may return nothing. For example, selector `VariableDeclarator > Identifier:first-child` returns `<Identifier>`, where esquery returns `null`.
* Nested attribute selector should be replaced with subject indicator (or :has): `[attr.subAttr=xyz]` → `![attr] > [subAttr=xyz]`
* To select custom esquery pseudos like `:statement`, it is recommended to use [`esdom/query`](query.js), otherwise it should be replaced with natural DOM class `.Statement`.
* Regular expression and conditional selectors should be replaced with according css selectors.


In all other regards it works just the same.


# Notes

* esquery is inable to select list of nodes, like all function params, or all function body statements. With esdom you can do `.Function > [prop="params"]`.
* esdom might be somewhat slow in browsers due to using browser API. In node, DOM is emulated via [dom-lite](https://www.npmjs.com/package/dom-lite), so it’s times faster.
* esdom work only with ES5.


# Analysis

ESDOM also provides helpful scope/variable analysis, marking nodes with additional `data-` attributes. To analyze DOM, call `esdom.analyze(dom)`, and it will set attributes:

| Attribute | Description |
|---|---|
| `data-scope=<id>` | Scope indicator |
| `data-scope-global` | Global scope flag |
| `data-scope-parent=<scope-id>` | Parent scope id |
| `data-variable=<id>` | Variable indicator with unique id |
| `data-variable-declaration` | Variable declaration flag |
| `data-variable-scope=<scope-id>` | Variable holding scope |



# API

| Method | Description |
|---|---|
| `.toDOM(ast)` | Convert AST to DOM element. |
| `.toAST(element)` | Build AST from DOM element. |
| `.analyze(element)` | Mark up AST nodes |

[![NPM](https://nodei.co/npm/esdom.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/esdom/)