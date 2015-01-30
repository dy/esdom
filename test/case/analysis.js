//plain declaration
var a = {
	//sub-declaration
	b: {
	}
};

//assignment declaration
a.b.c = {};

//calculated assignment declaration
var s = 'x';
a.b.c[s + ''] = 1;

//calculated externalized assignment
a.b.c[Number.MAX_VALUE] = 2;

//interfered function name
function x(x,y){
	x; arguments;
}

function y(){
	x.y = 1;
}

//super-scoped expression
(function(){
	function z(){
		a.c = 1;
	}
})();