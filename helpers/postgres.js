const { Pool, Client } = require('pg')
const stream = require('stream');

//create connection to database by host,user,password and database. For this mysql2 package is used tomake connection to mysql 
exports.createConnection = async function (config) {


    var payload = {
		host: config.host,
		user: config.username,
		password: config.password,
		database: config.database,
        port:config.port
	}

    console.log(payload,'payload')

    return new Promise((resolve, reject) => {

        const client = new Client(payload)
        // console.log(client)
        client.connect()
        .then(() => {
            console.log('here')
            reject({
                message: err,
                status: 0
            });
        })
        .catch(err => {
            console.log('here done')
            resolve({
                connection: client,
                status: 1
            });
        });
            
        

    }).catch(error => {

       console.log('err post')
    });

}