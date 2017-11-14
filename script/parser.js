process.chdir(__dirname);

require('dotenv').load();

const CWLogsWritable = require('cwlogs-writable');
const aws_config = {region: "eu-central-1"};
const fs = require('fs');
const jsdom = require("jsdom");
const uuid = require('uuid');
const http = require('http');

const cleaner = require('./my-cleaner');
const standardizer = require('./my-standardizer');

var logStreamName = [
	process.argv[2],
	new Date().toISOString(),
	uuid.v1()
].filter(Boolean).join('/').replace(/[:*]/g, '');

var stream = new CWLogsWritable({
	logGroupName: "HTML_SCRAPER/PARSER",
	logStreamName:logStreamName,
	cloudWatchLogsOptions: aws_config
});

stream.write("----------- START -----------");

//get target from command line input
var target = process.argv[2];
var paths = getPathsObject(target);
var counter;
var docClient;

stream._write("current target " + target);
stream._write("current paths " + paths);


var saveCallback = function (obj) {
	var params = {
		TableName: "report-table",
		Item: obj
	};

	docClient.put(params, function (err, data) {
		if (err) {
			stream._write(
				"Unable to add item. Error JSON:" + 
				JSON.stringify(err, null, 2)
			);
		} else {
			stream._write(
				"Added item:"+
				JSON.stringify(obj, null, 2)
			);
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
});


function parseAndSubmitReport(files,counter, save) {
	var filename = files[counter];
	var index= files[counter].split('.')[0];

	stream._write("parsing " + filename);

	var report = { "OnsiteId": Number(index) };
	var htmlString = fs.readFileSync("../reports/"+target + "/" + filename).toString();
	
	//create the object from the html page
	jsdom.env(htmlString, function (err, window) {
		if (err) {
			stream._write("ERROR" + err);
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
		//logger.log("deleted\t" + target+"-reports/"+filename);
		if (counter + 1 < files.length) {
			setTimeout(function () {
				parseAndSubmitReport(files, counter + 1, save);
			}, 2000);
		}
	});
}

function initDb() {
	var AWS = require("aws-sdk");

	AWS.config.update(aws_config);

	docClient = new AWS.DynamoDB.DocumentClient();
}

function getPathsObject(t) {
	var data = fs.readFileSync("../assets/"+target + "-paths.json");
	return JSON.parse(data);
}