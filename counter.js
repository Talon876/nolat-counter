var http = require('http');
var Router = require('node-simple-router');
var router = Router();

//configuration
var PORT = 3001;

//data
var statArray = {};
var newStatObj = function(ip) {
	var stat = {
		total: 1,
		unique: 1,
		map: {}
	}
	stat.map[ip] = 1;
	return stat;
}

//endpoints
var count = function(request, response) {
	var variable = request.params.variable;
	var ip = request.headers['x-forwarded-for'];
	var stats = statArray[variable];

	if (statArray[variable] === undefined) {
		statArray[variable] = newStatObj(ip);
	} else {
		statArray[variable].total++;
		if(statArray[variable].map[ip] === undefined) {
			statArray[variable].unique++;
			statArray[variable].map[ip] = 1;
		} else {
			statArray[variable].map[ip]++;
		}
	}

	console.log("#" + statArray[variable].total + " from " + ip + " for " + variable);
	statArray[variable] = statArray[variable];

	response.writeHead(200, {"Content-Type": "text/plain"});
	response.end('ok');
}

var help = function(request, response) {
	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write('GET /counter displays this help\n');
	response.write('GET /counter/list displays the list of gathered variables\n');
	response.write('GET /counter/api/list json formatted variable list\n');
	response.write('GET /counter/c/:variable will store metrics for that variable\n');
	response.write('GET /counter/c/:variable/stats will show the gathered metrics\n');
	response.end();
}

var renderStats = function(request, response) {
	var variable = request.params.variable;
	var stats = statArray[variable];
	response.writeHead(200, {"Content-Type": "text/plain"});

	if (stats === undefined) {
		response.end('no stats exist for ' + variable);
	} else {
		response.write('Variable: ' + variable + '\n\n');
		response.write('Total Visitors: ' + stats.total + '\n');
		response.write('Unique Visitors: ' + stats.unique + '\n');
		response.write('-Breakdown- \n');
		for(var ip in stats.map) {
			if (stats.map.hasOwnProperty(ip)) {
				response.write(ip + ': ' + stats.map[ip] + ' visits\n');
			}
		}
		response.end()
	}
}

var listVariables = function(request, response) {
	response.writeHead(200, {"Content-Type": "text/html"});
	var totalVisits = 0;
	var totalUnique = 0;
	var totalVars = 0;

	for(var variable in statArray) {
		if(statArray.hasOwnProperty(variable)) {
			var data = statArray[variable];
			totalVisits += data.total;
			totalUnique += data.unique;
			totalVars++;

			response.write('Variable: <a href="/counter/c/' + variable + '/stats">' + variable + '</a> (' + data.total + '|' + data.unique + ')<br>');
		}
	}
	response.write('<br>Total Variables: ' + totalVars + '<br>');
	response.write('Total Visits: ' + totalVisits + '<br>');
	response.write('Total Unique: ' + totalVars + '<br>');
	response.end();
/*
	response.write('Total Variables Tracked: ' + statArray.length + '<br>');
	for(var stats in statArray) {
		var data = statArray[stats];
		totalVisits += data.total;
		totalUnique += data.unique;
		response.write('<br>Variable: <a href="/counter/c/' + data.variable + '/stats">' + data.variable + '</a> (' + data.total + '|' + data.unique + ')<br>');
	}
	response.write('<br>       Total Visits: ' + totalVisits + '<br>');
	response.write('Total Unique Visits: ' + totalUnique + '<br>');
	response.end();
	*/
}

var listVariablesApi = function(request, response) {
	response.writeHead(200, {"Content-Type": "text/json"});
	response.end(JSON.stringify(statArray));
}

//routing
router.get('/counter', help);
router.get('/counter/list', listVariables);
router.get('/counter/api/list', listVariablesApi);
router.get('/counter/c/:variable', count);
router.get('/counter/c/:variable/stats', renderStats);

//server setup
var server = http.createServer(router);
server.listen(PORT, 'localhost');
console.log("Running on port " + PORT);

