# esdom [![Build Status](https://travis-ci.org/dfcreative/esdom.svg?branch=master)](https://travis-ci.org/dfcreative/esdom) [![Code Climate](https://codeclimate.com/github/dfcreative/esdom/badges/gpa.svg)](https://codeclimate.com/github/dfcreative/esdom) <a href="UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="20"/></a>

Build up DOM from AST or AST from DOM. Just because it’s far simpler to use DOM to manipulate and traverse nodes, as you used to, instead of tricky AST, even with tools like [esquery](https://github.com/estools/esquery) or [ast-types](https://github.com/benjamin/ast-types). Besides, there are jQuery and a bunch of other DOM-tools.

Works both in browsers and node.


`$ npm install esdom`


```js
var esdom = require('esdom');
var esprima = require('esprima');
var escodegen = require('escodegen');

var ast = esprima.parse(code);

var el = esdom.domify(ast);
el.querySelector('Identifier').setAttribute('name', 'x');

ast = esdom.parse(el);
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
```

And resulting HTML:

```html
<VariableDeclaration type="VariableDeclaration" class="Declaration" declarations="VariableDeclarator" >
	<VariableDeclarator type="VariableDeclarator" id="Identifier" init="Literal">
		<Identifier type="Identifier" name="a"/>
		<Literal type="Literal" value="1" raw="1"/>
	</VariableDeclarator>
</VariableDeclaration>
```

So for the structure all esquery css selectors work just fine with some exceptions:

* `:first-child` and `:last-child` selectors always return non-empty result, where esquery may return nothing. For example, `VariableDeclarator > Identifier:first-child` returns `<Identifier>`, where esquery returns `null`.
* Nested attribute selector should be replaced with [subject indicator](): `[attr.subAttr=xyz]` → `![attr] > [subAttr=xyz]`
* Class of selector `:statement` should be replaced with natural DOM class `.statement`.
* Regular expression and conditional selectors should be replaced with according css selectors.

In all other regards it works just the same.


# Notes

* esquery is significally flawed by inability to select all function params, or all function body statements. It would be natural to select things like `FunctionDeclaration > params > *` or `FunctionDeclaration > [prop=params]`


# API

| Method | Description |
|---|---|
| `.domify(ast)` | Convert AST to DOM element. |
| `.parse(element)` | Build AST from DOM element. |


[![NPM](https://nodei.co/npm/esdom.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/esdom/)