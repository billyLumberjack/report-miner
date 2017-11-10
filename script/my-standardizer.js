const fs = require('fs');

exports.standardizeReport = function(report, target){
	//console.log("\x1b[33m","standardizing report",report.Id);
	// per ogni proprietà, controlla se nel <target>-paths.json esiste un dictionary
	// se esiste sostituisci il corrente valore in report con quello del dizionario

	var propertiesData = fs.readFileSync("../assets/"+target+"-paths.json");
	propertiesData = JSON.parse(propertiesData);

	var dictionary = {};

	for(property in propertiesData){
		
		//console.log("\x1b[37m","current property",property);
		

		if(propertiesData[property].dictionary != undefined){
			//console.log("\t",property,"HAS DICTIONARY");
			dictionary = propertiesData[property].dictionary;

			//console.log("\x1b[31m","\tCHANGING",report[property],"TO",dictionary[report[property]],"\x1b[37m");
			report[property] = dictionary[report[property]];
		}
	}

	report = standardizeStartEndAltitudes(report);

	return report;
	
};

function standardizeStartEndAltitudes(report) {
	if (report.ElevationGain != undefined) {
		//per standardizzare, mi serve almeno il dislivello
		if(report.StartingAltitude != undefined && report.EndAltitude == undefined){
			//Starting altitude set && End altitude NOT set
			report["EndAltitude"] = report.StartingAltitude + report.ElevationGain;
		} else if(report.StartingAltitude == undefined && report.EndAltitude != undefined){
			//Starting altitude NOT set && End altitude set
			report["StartingAltitude"] = report.EndAltitude - report.ElevationGain;
		}
	}
	return report;
}