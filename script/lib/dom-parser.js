const jsdom = require("jsdom");
const uuid = require('uuid');
const jQuery = require("jquery");

/**
 * @param {any} awsConfig
 */


function parseDom(window,paths) {

    $ = jQuery(window);
    var report = {};

    //per ogni proprietà nel file paths del corrente target
    for (property in paths) {
        var path = paths[property]["path"];
        // se sto considerando la proprietà images e ne esistono del file .html
        if (property == "Images" && window.$(path).length > 0) {

            report[property] = window.$(path).map(function () {
                return $(this).attr("href");
            }).get();

        } else {

            if (window.$(path).text() != "")
                report[property] = window.$(path).text();
        }
    }

    //se almeno TripName è stato trovato allora considero il report valido
    if (report["TripName"] != undefined) {

        report["Type"] = "ski-mountaineering";
        //report["Id"] = uuid.v1();

        //save to database
        return report;
    }
    else{
        return null;
    }
}

//export
exports.parseAndSaveFromHtmlString = function (htmlString,pp) {
    

    //create the object from the html page
    return new Promise((resolve,reject) => {
        jsdom.env(
            htmlString,
            function(err,window){

                if(err)
                    reject("ERROR", err);
                
                var obj = parseDom(window, pp);
                if(obj != null){
                    resolve(obj);
                }else{
                    reject("Invalid report !!!");
                }
            }
        );
    });

};