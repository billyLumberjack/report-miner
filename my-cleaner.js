const fs = require('fs');

var cleanReport = function(report, target) {
	console.log(report);

	report = cleanProperties(report, target);

	report = convertNumbers(report);
	report = convertDate(report);

	console.log(report);

	return report;
};

function cleanProperties(object, t){
	var data = fs.readFileSync(t+"-paths.json");
	var properties = JSON.parse(data);

	var replaceStr, withStr;

	for(property in properties){


		if(property === "Images" && object[property] != undefined){

			for(var i=0; i<object[property].length; i++){
				replaceStr = properties[property]["replace"];
				withStr = properties[property]["with"];
				//console.log("for property " + property + " replace " + replaceStr + " with " + withStr);
				object[property][i] = object[property][i].replace(new RegExp(replaceStr,"g"), withStr);
			}
		}
		else if(object[property] != undefined){
			replaceStr = properties[property]["replace"];
			withStr = properties[property]["with"];
			//console.log("for property " + property + " replace " + replaceStr + " with " + withStr);
			object[property] = object[property].replace(new RegExp(replaceStr,"g"), withStr);
		}
	}

	return object;

}

function convertNumbers(object){
	var value;
	for(key in object){
		value = Number(object[key]);
		if(!isNaN(value))
			object[key] = value;
   }
   return object;	
}

function convertDate(object){
	var value = object["Date"];
	if (value != undefined){
		value = value.match(/[0-9]*\/[0-9]*\/[0-9]*/gi)[0];
		value = value.split("\/");
		value = value[1]+","+value[0]+","+value[2];
		object["Date"] = new Date(value).getTime();
	}
	return object;
}

exports.cleanReport = cleanReport;