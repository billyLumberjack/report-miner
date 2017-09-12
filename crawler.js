console.log("starting crawler...");

var Entities = require('html-entities').AllHtmlEntities;
entities = new Entities();
var fs = require('fs');

var target = getTarget();
var status = getCrawlingStatus();

saveReportById(
	status["last-id"][target["name"]]+1
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

	        response.setEncoding('binary');
	        
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
					fs.writeFileSync(target["name"]+"-reports/report-"+id+".html", entities.decode(body), 'utf8'); 
					
					console.log("report "+id+" written");
					status["last-id"][target["name"]] = id;
					var status_data = JSON.stringify(status);
					fs.writeFileSync("crawling-status.json", status_data);
				}
				else
				{
					console.log("few data with report " + id);
				}
				setTimeout(function() {saveReportById(id+1)}, 1000);
	        });
	   }
	   );
}

function getTarget(){
	var name = process.argv[2];
	var data = fs.readFileSync("target.json");
	data = JSON.parse(data);
	return data[name];
}

function getCrawlingStatus(){
	var data = fs.readFileSync("crawling-status.json");
	return JSON.parse(data);
}