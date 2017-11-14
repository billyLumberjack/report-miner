process.chdir(__dirname);

const CWLogsWritable = require('cwlogs-writable');
const jsdom = require("jsdom");
const http = require('http');
const fs = require('fs');
const $ = require("jquery");
const uuid = require("uuid");

var logStreamName = [
	process.argv[2],
	new Date().toISOString(),
	uuid.v1()
].filter(Boolean).join('/').replace(/[:*]/g, '');

var stream = new CWLogsWritable({
	logGroupName: "HTML_SCRAPER/CRAWLER",
	logStreamName:logStreamName,
	cloudWatchLogsOptions: {
		region: "eu-central-1"
	}
});

stream.write("----------- START -----------");


var target = getTarget();
var globalStatus = getCrawlingStatus();
var targetStatus = globalStatus[target.name];



stream.write(
	"current target" + 
	JSON.stringify(target,null,2)
);

stream.write(
	"current global status" + 
	JSON.stringify(globalStatus, null, 2)
);
//getting promise from last index
getLastIndex()
	.then((lastIndex) => {
		stream.write(
			"starting crawling from " + 
			(targetStatus.last_id + 1) +
			" to " +
			lastIndex);

		saveReportById(targetStatus.last_id + 1, lastIndex)
	})
	.catch((err) => {
		stream.write(
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
		},(response) => {
				var body = '';
				response.setEncoding(target["encoding"]);

				response.on('data', (chunk) => body += chunk);

				response.on('error', (err) => {
					stream.write(
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
							stream.write(
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
		(response)=> {
				var counter = 0;
				var body = '';

				response.setEncoding(target.encoding);

				response.on('data', (chunk) => {
					counter ++;
					body += chunk
				});

				response.on('error', (err) => {
					var url = target.host + target.path.replace("{s}", id);
					stream.write(
						"ERROR",
						"NET error with report " + id +" at url " + url,
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
						fs.writeFileSync("../reports/" + target.name + "/" + id + ".html", body);
						stream.write("written report " + id);

						//update crawling global status
						targetStatus.last_id = id;
						globalStatus[target.name] = targetStatus;
						fs.writeFileSync(
							"../assets/crawling-status.json",
							JSON.stringify(globalStatus, null, 2)
						);
					}
					else {
						stream.write("few data with report " + id);
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
	else{
		stream.write("nothing new to crawl");
		return;
	}
}
//close save report function



function getTarget() {
	if (process.argv[2] == undefined) {
		stream.write("please enter a target name");
		process.exit(1);
	}
	var name = process.argv[2];
	var data = fs.readFileSync("../assets/target.json");
	data = JSON.parse(data);
	return data[name];
}

function getCrawlingStatus() {
	var data = fs.readFileSync("../assets/crawling-status.json");
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