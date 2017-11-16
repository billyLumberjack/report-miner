const AWS = require("aws-sdk");

//costrutture
/**
 * @param {any} awsConfig
 */

var docClient;

function DynamoDbHelper(awsConfig) {
    AWS.config.update(awsConfig);
	docClient = new AWS.DynamoDB.DocumentClient();
};

/**
 * @param {string} str
 */
//metodo
DynamoDbHelper.prototype.putReport = function (obj) {
	var params = {
		TableName: "report-table",
		Item: obj
	};

	docClient.put(
        params,
        function (err, data) {
            if (err) {
                throw "Unable to add item. Error JSON:" + JSON.stringify(err, null, 2);
            }
            else{
                return obj;
            }
        })
};
//export
module.exports = DynamoDbHelper;