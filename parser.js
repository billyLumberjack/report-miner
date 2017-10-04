const fs = require('fs');
const jsdom = require("jsdom");
const uuid = require('uuid');
var http = require('http');
var cleaner = require('./my-cleaner');

console.log("starting parser...");

var app, db, ref, $;
//get target from command line input
var target = process.argv[2];
var paths = getPathsObject(target);
var counter;
var docClient;
initDb();



//read files inside report folder and foreach one call the parser
//the last file is marked with last because has to close the firebase app
fs.readdir(target+"-reports", function(err, files){
	files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
	counter = files.length;
  	for (var i=0; i<files.length; i++) {
  		//call the parser for the current file
  		parseAndSubmitReport(files[i],files[i].split('.')[0], saveCallback);
  	}
  });

var saveCallback = function(obj){

	

	var params = {
    	TableName:"report-table",
    	Item:obj
    };


	console.log("Adding a new item:", obj);
	docClient.put(params, function(err, data) {
	    if (err) {
	        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("Added item:", JSON.stringify(data, null, 2));
	    }
	});	
	/*
		ref.push().set(obj).then(function () {
			counter--;
			if(counter == 0)
				app.delete()
		});
*/
};


function parseAndSubmitReport(filename,index,save){
	console.log("parsing " + filename);
	var report = {"OnsiteId" : Number(index)};
	var htmlString = fs.readFileSync(target+"-reports/"+filename).toString();
	//create the object from the html page
	jsdom.env(htmlString, function(err, window) {
	    if (err) {
	        console.error(err);
	        return;
	    }

	    $ = require("jquery")(window);
	    
	    for(property in paths){
	    	var path = paths[property]["path"];
	    	if(window.$(path).text() != "")
	    		report[property] = window.$(path).text();
	    }

	    if(report["TripName"] != undefined){
		    report["Type"] = "ski-mountaineering";
		    report["Site"] = target;
		    report["Id"] = uuid.v1();

			report = cleaner.cleanReport(report, target);	    	
			report["SearchTripName"] = report["TripName"].toLowerCase();
		    //delete the file
		    
		    //console.log("deleted\t" + target+"-reports/"+filename);
		    //save to firebase
		    save(report);
		    //console.log(JSON.stringify(report, null, 4));			
	    }
	    //fs.unlinkSync(target+"-reports/"+filename);	
	});
}

function initDb(){
	var AWS = require("aws-sdk");

	AWS.config.update({
	  region: "eu-central-1"
	});

	docClient = new AWS.DynamoDB.DocumentClient();	
	/*
	var admin = require("firebase-admin");
	var serviceAccount = require("./serviceAccountKey.json");

	app = admin.initializeApp({
	  credential: admin.credential.cert(serviceAccount),
	  databaseURL: "https://report-miner-16266.firebaseio.com"
	});

	db = admin.database();
	ref = db.ref("report");
	*/
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