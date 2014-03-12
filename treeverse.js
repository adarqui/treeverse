#!/usr/bin/env node

'use strict';

var fs = require('fs');
var util = require('util');

var usage = function() {
	console.log("./compare.js diff")
	process.exit();
}

var store_path = function(g, s, last) {
	var a = s.split('/');
	var gn = g;
	for (var v in a) {
		v = parseInt(v, 10);
		var x = a[v];
		var p = gn[x];
		var c;
		if(p == undefined) {
			gn[x] = { same:0, diff:0, child: {} }
			c = gn[x].child;
		} else {
			c = p;
		}
		gn = gn[x].child;
		if(last == 'identical') {
			c.same = c.same + 1;
		} else {
			if (c.diff == undefined) { c.diff = 0; }
			c.diff = c.diff + 1;
		}
	}
}


var treeverse = function(j, p) {
	if(j.child == undefined) return;
	for(var v in j.child) {
		var d = j.child[v];
		if (typeof v !== 'string') {
		} else if (d.diff == 0) {
			if(d.child == undefined) continue;
			if(Object.keys(d.child).length > 1) {
				console.log(p.join('/')+'/'+v);
			}
		} else {
			p.push(v);
			treeverse(d, p);
			p.pop();
		}
	}
}


var main = function(argc, argv) {

	var diff, lines, files, i;

	if (argc < 3) {
		usage();
	}

	files = argv.slice(2, argc);

	var diffs = files.map(function(d) {
		try {
			return fs.readFileSync(d).toString();
		} catch (err) {
			console.log("ERROR:", err);
			process.exit();
		}
	});

	if (diffs.length > 1) {
		files.push(files.join(' + '));
		diffs.push(diffs.join(''));
	}

	i = 0;
	diffs.forEach(function(x) {

		var js = {};

		console.log("Showing similarities for:", files[i]);
		++i;

		lines = x.split('\n');

		lines.forEach(function(d) {

			var line = d.split(' ');
			switch (line[0]) {
				case 'Only': {
					var last = 'differ';
					var f = line[2].replace(/:/g,'');
					store_path(js, f, last);
					break;
				}
				case 'Files' : {
					var last = line[line.length-1];
					store_path(js, line[1], last);
					break;
				}
				default: {
					return;
				}
			}
		});

		if (process.env['DEBUG']) {
			console.log(util.inspect(js, {showHidden: false, depth: null}));
			return
		}

		for(var v in js) {
			treeverse(js[v], []);
		}
	});


	/*
	for(var v in js) {
		treeverse(js[v], []);
	}
	*/

}


main (process.argv.length, process.argv);
