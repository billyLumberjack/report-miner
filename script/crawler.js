process.chdir(__dirname);

console.log("starting crawler...");

var Entities = require('html-entities').AllHtmlEntities;
entities = new Entities();
var fs = require('fs');

var target = getTarget();
var status = getCrawlingStatus();
var crawled = 0;

saveReportById(
	status["last-id"][target["name"]]
	);

function saveReportById(id){
	
	var http = require('http');

	http.get({
	        host: target["host"],
	        path: target["path"].replace("{s}",id),
	        headers: {
	        	"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:55.0) Gecko/20100101 Firefox/55.0"
	        }
	    },
	    function(response) {
	    	var body = '';
	        var counter = 0;

	        response.setEncoding(target["encoding"]);
	        
	        response.on('data', function(d) {
	            body += d;
	            counter++;
	        });

	        response.on('error', function(err) {
	        	console.log("net error with report " + id);
	        	setTimeout(function() {saveReportById(id)}, 60000);
	        });	        

	        response.on('end', function() {
	        	if(counter > 1)
	        	{

					fs.writeFileSync("../reports/"+target["name"]+"/"+id+".html", body); 
										
					console.log("report "+id+" written");
					status["last-id"][target["name"]] = id;
					var status_data = JSON.stringify(status);
					fs.writeFileSync("../assets/crawling-status.json", status_data);

					crawled++;
					if(crawled === 50)
						return;
				}
				else
				{
					console.log("few data with report " + id);
				}

				/*setTimeout(function() {*/saveReportById(id-1)/*}, 1000);*/
	        });
	   }
	   );
}

function getTarget(){
	if(process.argv[2] == undefined){
		console.log("please enter a target name");
		process.exit(1);
	}
	var name = process.argv[2];
	var data = fs.readFileSync("../assets/target.json");
	data = JSON.parse(data);
	return data[name];
}

function getCrawlingStatus(){
	var data = fs.readFileSync("../assets/crawling-status.json");
	return JSON.parse(data);
}