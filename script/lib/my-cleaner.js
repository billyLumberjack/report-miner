const fs = require('fs');

exports.cleanReport = function(report, pp) {

	report = cleanProperties(report, pp);

	report = convertNumbers(report);
	report = convertDate(report);


	return report;
};

function cleanProperties(object, pp){
	//var data = fs.readFileSync("../assets/"+t+"-paths.json");
	var properties = pp;

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
			object[property] = object[property].trim();
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