const fs = require('fs');
const jsdom = require("jsdom");
const $;
var http = require('http');

console.log("starting parser...");

var app, db, ref;
//get target from command line input
var target = process.argv[2];
var paths = getPathsObject(target);
var counter;
initFirebase();

console.log("succesfully connected to firebase");



//read files inside report folder and foreach one call the parser
//the last file is marked with last because has to close the firebase app
fs.readdir(target+"-reports", function(err, files){
	if(files.length > 1){
		counter = files.length;
	  	for (var i=0; i<files.length; i++) {
	  		//call the parser for the current file
	  		parseAndSubmitReport(files[i],files[i].split('.')[0], saveCallback);
	  	}
	  }else{
	  	app.delete();
	  }
  });

var saveCallback = function(obj){
		ref.push().set(obj).then(function () {
			counter--;
			if(counter == 0)
				app.delete()
		});
};


function parseAndSubmitReport(filename,index,save){
	console.log("parsing " + filename);
	var report = {"OnsiteId" : index};
	var htmlString = fs.readFileSync(target+"-reports/"+filename).toString();
	//create the object from the html page
	jsdom.env(htmlString, function(err, window) {
	    if (err) {
	        console.error(err);
	        return;
	    }

	    $ = require("jquery")(window);
	    
	    for(path in paths){
	    	report[path] = window.$(paths[path]).text();
	    }
	    report["Type"] = "ski-mountaineering";
	    //delete the file
	    fs.unlinkSync(target+"-reports/"+filename);
	    //console.log("deleted\t" + target+"-reports/"+filename);
	    //save to firebase
	    save(report);
	    //console.log(JSON.stringify(report, null, 4));
	});
}

function initFirebase(){
	var admin = require("firebase-admin");
	var serviceAccount = require("./serviceAccountKey.json");

	app = admin.initializeApp({
	  credential: admin.credential.cert(serviceAccount),
	  databaseURL: "https://report-miner-16266.firebaseio.com"
	});

	db = admin.database();
	ref = db.ref("report");
}

function getPathsObject(t){
	var data = fs.readFileSync(target+"-paths.json");
	return JSON.parse(data);
}

/*
  			//setup host for submit
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
*/