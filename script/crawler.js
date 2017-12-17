const dotenv = require('dotenv');
const jsdom = require("jsdom");
const http = require('http');
const fs = require('fs');
const $ = require("jquery");
const uuid = require("uuid");
const path = require('path');

const CwLogsHelper = require('./lib/cw-logs-helper');

const assetsFolder = "../assets";

process.chdir(__dirname);
dotenv.config();

if (!isTargetDefined())
	throw "please enter a target name";

const aws_config = {
	accessKeyId: process.env.ACCESS_KEY_ID,
	secretAccessKey: process.env.SECRET_ACCESS_KEY,
	region: process.env.REGION
};

const cwLogsHelper = new CwLogsHelper("HTML_SCRAPER/CRAWLER", process.argv[2], aws_config)

cwLogsHelper.write("----------- START -----------");

var target = getTarget();
var globalStatus = getCrawlingStatus();
var targetStatus = globalStatus[target.name];

const reportFolderPath = "../reports/" + target.name;

ensureDirectoryExistence(reportFolderPath + "/token");

cwLogsHelper.write(
	"current target" +
	JSON.stringify(target, null, 2)
);

cwLogsHelper.write(
	"current global status" +
	JSON.stringify(globalStatus, null, 2)
);

//getting promise from last index
getLastIndex()
	.then((lastIndex) => {
		cwLogsHelper.write(
			"starting crawling from " +
			(targetStatus.last_id + 1) +
			" to " +
			lastIndex);

		saveReportById(targetStatus.last_id + 1, lastIndex);
	})
	.catch((err) => {
		cwLogsHelper.write(
			"ERROR" +
			"error retrieving last index from list\n" +
			err
		);
	});

function getLastIndex() {
	return new Promise((resolve, reject) => {

		http.get({
			host: target.host,
			path: target.list.urlPath,
			headers: {
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:55.0) Gecko/20100101 Firefox/55.0"
			}
		}, (response) => {
			var body = '';
			response.setEncoding(target["encoding"]);

			response.on('data', (chunk) => body += chunk);

			response.on('error', (err) => {
				cwLogsHelper.write(
					"ERROR" +
					"NET error retrieving list for new reports with target" + target["name"] +
					err
				);
				reject(err);
			});

			response.on('end', () => {
				//create the object from the html page
				jsdom.env(body, function (err, window) {
					if (err) {
						cwLogsHelper.write(
							"ERROR" +
							"JSDOM error retrieving list for new reports with target" + target["name"] +
							err
						);
						reject(err);
					}
					$(window);
					resolve(
						getParameterByName(
							target["list"]["param"],
							window.$(target["list"]["cssPath"]).attr("href")
						)
					);
				});
			});
		});
	});
}

function saveReportById(id, endId) {

	if (id <= endId) {

		http.get({
			host: target.host,
			path: target.path.replace("{s}", id),
			headers: {
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:55.0) Gecko/20100101 Firefox/55.0"
			}
		},
			(response) => {
				var counter = 0;
				var body = '';

				response.setEncoding(target.encoding);

				response.on('data', (chunk) => {
					counter++;
					body += chunk
				});

				response.on('error', (err) => {
					var url = target.host + target.path.replace("{s}", id);
					cwLogsHelper.write(
						"ERROR",
						"NET error with report " + id + " at url " + url,
						err
					);

					setTimeout(function () {
						saveReportById(id)
					}, 60000);
				});

				response.on('end', () => {
					//is the response valid?
					if (counter > 1) {
						//response valid, write html page to filesystem
						fs.writeFileSync(reportFolderPath + "/" + id + ".html", body);
						cwLogsHelper.write("written report " + id);

						//update crawling global status
						targetStatus.last_id = id;
						globalStatus[target.name] = targetStatus;
						fs.writeFileSync(
							assetsFolder + "/crawling-status.json",
							JSON.stringify(globalStatus, null, 2)
						);
					}
					else {
						cwLogsHelper.write("few data with report " + id);
					}

					//crawl NEXT one!
					setTimeout(function () {
						saveReportById(id + 1, endId)
					}, 1000);
				});
			}
		);
		//close http get
	}
	else {
		console.log("nothing to crawl", id, endId);
		cwLogsHelper.write("nothing new to crawl");
		cwLogsHelper.write("----------- END -----------");
		return;
	}
}
//close save report function



function getTarget() {
	var name = process.argv[2];
	var data = fs.readFileSync(assetsFolder + "/target.json");
	data = JSON.parse(data);
	return data[name];
}

function getCrawlingStatus() {
	var data = fs.readFileSync(assetsFolder + "/crawling-status.json");
	return JSON.parse(data);
}

function getParameterByName(name, url) {
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function ensureDirectoryExistence(filePath) {
	var dirname = path.dirname(filePath);
	if (fs.existsSync(dirname)) {
		return true;
	}
	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
}

function isTargetDefined() {
	return process.argv[2] != undefined;
}