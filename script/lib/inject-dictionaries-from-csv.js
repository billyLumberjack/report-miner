var fs = require('fs');

var dir = process.argv[2];
var file_1 = process.argv[3];
var file_2 = process.argv[4];

var target_1 = JSON.parse(fs.readFileSync(file_1));
var target_2 = JSON.parse(fs.readFileSync(file_2));


fs.readdir(dir, function (err, files) {
	
    files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
    var key = "";
    var dic_1 = {}, dic_2 = {};

	for (var i = 0; i < files.length; i++) {
        console.log("target_1",file_1)
        console.log("target_2",file_2)
        key = files[i].split(".")[0];
        console.log(key)
        //leggi csv
        csv_array = getArrayFromCsv(files[i]);
        //crea dic_1 da inserire in target_1
        dic_1 = getDictionaryFromColumns(csv_array,0,2);
        //crea dic_2 da inserire in target_2
        dic_2 = getDictionaryFromColumns(csv_array,1,2);
        // inserisci dic_* net target relativo
        target_1[key]["dictionary"] = dic_1;
        target_2[key]["dictionary"] = dic_2;
    }
    fs.writeFileSync(file_1, JSON.stringify(target_1,null,2));    
    fs.writeFileSync(file_2, JSON.stringify(target_2,null,2));
    
});

function getArrayFromCsv(filename){
    var csv = fs.readFileSync(dir+"/"+filename).toString();    
    
    csv = csv.split("\n");
    for(var c=0;c<csv.length;c++){
        csv[c] = csv[c].split(";");
    }
    return csv;
}

function getDictionaryFromColumns(array,col_1,col_2){
    var obj = {};
    var key = "", value ="";

    for(var c=0; c<array.length; c++){
        
        key = array[c][col_1];
        value = array[c][col_2];

        if(key != "" && value != ""){
            obj[key] = value;
        }
    }
    return obj;
}