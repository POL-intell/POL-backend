var mysql = require('mysql2');
const stream = require('stream');
const { createPool } = require('mysql2');


//create connection to database by host,user,password and database. For this mysql2 package is used tomake connection to mysql 
exports.createConnection = async function (config) {
    var payload = {
		host: config.host,
		user: config.username,
		password: config.password,
		database: config.database,
	}
    return new Promise((resolve, reject) => {

        var connection = mysql.createConnection(payload);
        connection.connect(function (err, result) {
            if (err) {
                console.log(err, 'err here')

                reject({
                    message: err,
                    status: 0
                });
            } else {
                console.log('connection here')
                resolve({
                    connection: connection,
                    status: 1
                });
            }
        });
    }).catch(error => {
        console.log('eee', 'error', error)

    });


}