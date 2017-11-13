process.chdir(__dirname);

const fs = require('fs');
const jsdom = require("jsdom");
const uuid = require('uuid');
var http = require('http');

var cleaner = require('./my-cleaner');
var standardizer = require('./my-standardizer');

console.log("starting parser...");

var app, db, ref, $;

//get target from command line input
var target = process.argv[2];
var paths = getPathsObject(target);
var counter;
var docClient;

var saveCallback = function (obj) {
	var params = {
		TableName: "report-table",
		Item: obj
	};

	docClient.put(params, function (err, data) {
		if (err) {
			console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		} else {
			console.log("Added item:", JSON.stringify(obj, null, 2));
		}
	});
};


initDb();
//read files inside report folder and foreach one call the parser
//the last file is marked with last because has to close the firebase app
fs.readdir("../reports/"+target, function (err, files) {
	
	files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
	counter = files.length;

	parseAndSubmitReport(files,0, saveCallback);

	/*for (var i = 0; i < files.length; i++) {
		//call the parser for the current file
		parseAndSubmitReport(files[i], files[i].split('.')[0], saveCallback);
	}*/
});


function parseAndSubmitReport(files,counter, save) {
	var filename = files[counter];
	var index= files[counter].split('.')[0];

	console.log("parsing " + filename);

	var report = { "OnsiteId": Number(index) };
	var htmlString = fs.readFileSync("../reports/"+target + "/" + filename).toString();
	
	//create the object from the html page
	jsdom.env(htmlString, function (err, window) {
		if (err) {
			console.error(err);
			return;
		}

		$ = require("jquery")(window);
		//per ogni proprietà nel file paths del corrente target
		for (property in paths) {
			var path = paths[property]["path"];
			// se sto considerando la proprietà images e ne esistono del file .html
			if (property == "Images" && window.$(path).length > 0) {

				report[property] = window.$(path).map(function () {
					return $(this).attr("href");
				}).get();

			} else {

				if (window.$(path).text() != "")
					report[property] = window.$(path).text();
			}
		}

		//se almeno TripName è stato trovato allora considero il report valido
		if (report["TripName"] != undefined) {

			report["Type"] = "ski-mountaineering";
			report["Site"] = target;
			report["Id"] = uuid.v1();
			report["SearchTripName"] = report["TripName"].toLowerCase();

			//clean
			report = cleaner.cleanReport(report, target);
			//standardize
			report = standardizer.standardizeReport(report,target);

			//save to database
			save(report);
			//fs.appendFileSync("ciccio.csv", JSON.stringify(report)+",\n");
		}
		//delete current .html file
		//fs.unlinkSync(target+"-reports/"+filename);	
		//console.log("deleted\t" + target+"-reports/"+filename);
		if (counter + 1 < files.length) {
			setTimeout(function () {
				parseAndSubmitReport(files, counter + 1, save);
			}, 2000);
		}
	});
}

function initDb() {
	var AWS = require("aws-sdk");

	AWS.config.update({
		region: "eu-central-1"
	});

	docClient = new AWS.DynamoDB.DocumentClient();
}

function getPathsObject(t) {
	var data = fs.readFileSync("../assets/"+target + "-paths.json");
	return JSON.parse(data);
}