const dotenv = require('dotenv');
const fs = require('fs');
const http = require('http');

const cleaner = require('./lib/my-cleaner');
const standardizer = require('./lib/my-standardizer');
const CwLogsHelper = require('./lib/cw-logs-helper');
const DynamoDbHelper = require('./lib/dynamo-db-helper');
const domParser = require('./lib/dom-parser');

process.chdir(__dirname);
dotenv.config();

if (process.argv[2] == undefined)
	throw "please enter a target name";

var target = process.argv[2];

const aws_config = {
	accessKeyId:process.env.ACCESS_KEY_ID,
	secretAccessKey:process.env.SECRET_ACCESS_KEY,
	region: process.env.REGION
};
const cwLogsHelper = new CwLogsHelper("HTML_SCRAPER/PARSER", target,aws_config)
const dbHelper = new DynamoDbHelper(aws_config); 
//var docClient = initDb();

var paths = getPathsObject(target);



cwLogsHelper.write("----------- START -----------");
cwLogsHelper.write("current target " + target);

//read files inside report folder and foreach one call the parser
//the last file is marked with last because has to close the firebase app
fs.readdir("../reports/"+target, function (err, files) {
	files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
	if(files.length > 0)
		parseAndSubmitReport(files,0, dbHelper.putReport);
	else{
		cwLogsHelper.write("no documents to parse");
		cwLogsHelper.write("----------- END -----------");
	}
});


function parseAndSubmitReport(files,index, save) {
	var filename = files[index];

	cwLogsHelper.write("parsing " + filename);

	var htmlString = fs.readFileSync("../reports/"+target + "/" + filename).toString();
	domParser
		.parseAndSaveFromHtmlString(htmlString, paths)
		.then((report) => {
			
			//clean
			report = cleaner.cleanReport(report, paths);
			//standardize
			report = standardizer.standardizeReport(report, paths);

			report["SearchTripName"] = report["TripName"].toLowerCase();
			report["OnsiteId"] = Number(files[index].split('.')[0]);
			report["Site"] = target;
			
			save(report);
			//delete current .html file
			fs.unlinkSync("../reports/" + target + "/" + filename);
			cwLogsHelper.write("deleted\t" + target + "\t" + filename);

			if (index + 1 < files.length) {
				setTimeout(function () {
					parseAndSubmitReport(files, index + 1, save);
				}, 2000);
			}
			else
				cwLogsHelper.write("----------- END -----------");
		})
		.catch((err) => {
			console.log(err)
			throw err;
		});


}

function initDb() {
	AWS.config.update(aws_config);
	return new AWS.DynamoDB.DocumentClient();
}

function getPathsObject(t) {
	var data = fs.readFileSync("../assets/"+target + "-paths.json");
	return JSON.parse(data);
}

