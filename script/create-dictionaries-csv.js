var fs = require('fs');

var dic_1 = JSON.parse(fs.readFileSync(process.argv[2]));
var dic_2 = JSON.parse(fs.readFileSync(process.argv[3]));
var out_folder = process.argv[4];

var keys_1 = Object.keys(dic_1);
var keys_2 = Object.keys(dic_2);

var common_keys = intersect_safe(keys_1,keys_2);
var key, csv_str;

for (var index = 0; index < common_keys.length; index++) {
    
    key = common_keys[index];

    if (dic_1[key].hasOwnProperty("dictionary") && dic_2[key].hasOwnProperty("dictionary")) {
        csv_str = get_csv_from_dictionaries(dic_1[key]["dictionary"], dic_2[key]["dictionary"]);
        
        fs.writeFileSync(out_folder + "/" +key+".csv", csv_str);
    }
}

function get_csv_from_dictionaries(d1, d2){
    var key_dic_1 = Object.keys(d1).sort();
    var key_dic_2 = Object.keys(d2).sort();

    var max;
    if(key_dic_1.length > key_dic_2.length)
        max = key_dic_1.length;
    else
        max = key_dic_2.length;

    var str = "";

    for (var index = 0; index < max; index++) {

        if (index in key_dic_1)
            str += key_dic_1[index]
//        else
//            str += "";

        str += ";";

        if (index in key_dic_2)
            str += key_dic_2[index]
//        else
//            str += "";
            
        str += "\n";
    }
    return str;

}

function intersect_safe(a, b)
{
  var ai=0, bi=0;
  var result = [];

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}