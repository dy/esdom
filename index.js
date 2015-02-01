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