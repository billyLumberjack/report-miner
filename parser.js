console.log("starting parser...");
sitename = "onice";

const folder = sitename+"_reports";
const fs = require('fs');
const jsdom = require("jsdom");
const $;
var http = require('http');
var paths;


fs.readFile(sitename+"_paths.json", 'utf8', function (err, data) {
  if (err){
  	console.log(err);
  	throw err;
  }
  
  paths = JSON.parse(data);

  fs.readdir(folder, function(err, files){  	
  	//for (var i=0; i<files.length; i++) {

  		console.log(files);

  		parseReport(files[0], function(obj){

			var post_options = {
			  host: 'localhost',
			  port: '8080',
			  path: '/dataLayer/rest/activity',
			  method: 'POST',
			  headers: {'Content-Type': 'application/json'}
			};  	
			  // Set up the request
			var request = http.request(post_options, function(res) {
			      res.setEncoding('utf8');
			      res.on('data', function (chunk) {
			          console.log('Response: ' + chunk);
			      });
			  });

			request.write(JSON.stringify(obj));
			request.end();  					
  		});




  	//}
  });
  
});


function parseReport(filename, callback){
	console.log("parsing " + filename);
	var report = {};
	var htmlString = fs.readFileSync(folder+"/"+filename).toString();

	jsdom.env(htmlString, function(err, window) {
	    if (err) {
	        console.error(err);
	        return;
	    }

	    $ = require("jquery")(window);
	    for(path in paths){
	    	report[path] = window.$(paths[path]).text();
	    }
	    report["Type"] = "hiking";
	    //fs.unlinkSync(folder+"/"+filename);
	    //console.log("deleted\t" + folder+"/"+filename);
	    callback(report);
	    console.log(JSON.stringify(report, null, 4));
	});
}