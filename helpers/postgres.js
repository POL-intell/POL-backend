const { Pool, Client } = require('pg')
const stream = require('stream');
const QueryStream = require('pg-query-stream')
const BatchStream = require('batch-stream');

//create connection to database by host,user,password and database. For this mysql2 package is used tomake connection to mysql 
exports.createConnection = async function (config) {


    var payload = {
        host: config.host,
        user: config.username,
        password: config.password,
        database: config.database,
        port: config.port
    }

    return new Promise((resolve, reject) => {

        const client = new Client(payload)

        client.connect()
            .then(() => {
                console.log('here done post')
                resolve({
                    connection: client,
                    status: 1
                });

                // reject({
                //     message: err,
                //     status: 0
                // });
            })
            .catch(err => {
                console.log('here err post')
                // resolve({
                //     connection: client,
                //     status: 1
                // });
                reject({
                    message: err,
                    status: 0
                });
            });



    }).catch(error => {

        console.log('err post')
    });

}

async function makeConnection(config) {
    var payload = {
        host: config.host,
        user: config.username,
        password: config.password,
        database: config.database,
        port: config.port
    }



    return new Promise((resolve, reject) => {

        const client = new Client(payload)

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
exports.getTablesListOfDatabase = async function (config) {
    return new Promise((resolve, reject) => {
        makeConnection(config).then((db) => {

            if (db) {
                var q = "SELECT table_name FROM information_schema.tables WHERE table_catalog='" + config.database + "' AND table_schema='public' AND table_type='BASE TABLE'";

                db.connection.query(q, function (error, results, fields) {

                    if (error) {
                        reject({
                            message: error,
                            status: 0
                        });
                    } else {
                        results = results.rows.map((e) => {
                            return { 'TABLE_NAME': e.table_name }
                        })

                        resolve({
                            result: results,
                            status: 1
                        });
                    }
                });


            } else {
                console.log('here reject')
                reject({
                    message: "error",
                    status: 0
                });

            }
        }).catch((err) => console.log(err, 'errrrrr'));;



    });
}
//get and return if there is some unique,primary etc column exist or not
exports.getUniqueCol = async function (config, table) {

    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {


            if (db && db.status == 1) {
                db.connection.query("SELECT K.COLUMN_NAME,T.CONSTRAINT_TYPE FROM  INFORMATION_SCHEMA.TABLE_CONSTRAINTS T JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE K ON K.CONSTRAINT_NAME=T.CONSTRAINT_NAME  WHERE K.TABLE_NAME='" + table + "' group by K.COLUMN_NAME,T.CONSTRAINT_TYPE"
                    , function (error, results) {

                        //console.log(error,results)
                        results = results.rows
                        if (results.length > 0) {
                            var cols = results.map((e) => e.column_name)
                            console.log(cols, 'colscols')
                            resolve({ cols: cols })
                        } else {
                            reject(0)
                        }
                    });

            } else {
                reject(0)
            }
        });
    });
}
exports.getTableData = async function (config, table) {

    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {
            var data = [];
            if (db && db.status == 1) {
                const batchSize = 50000; // process two rows at a time
                const batchStream = new BatchStream({ size: batchSize });

                const query = new QueryStream('SELECT * FROM ' + table)
                const stream = db.connection.query(query)

                stream.on('data', (row) => {
                   // console.log(row)
                    batchStream.write(row);
                })

                stream.on('end', () => {
                    //console.log('done')
                    batchStream.end();
                })


                batchStream.on('data', function (batch) {
                   // console.log('Received batch:', batch);
                    // process the batch of rows
                    data = [...data, ...batch]
                });

                batchStream.on('end', function () {
                    //console.log('Finished processing all rows.');
                    resolve(data)
                    db.connection.end();
                });



            } else {
                reject(0)
            }
        });
    });
}
exports.getSqlData = async function (config, sql) {

    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {
            var data = [];
            if (db && db.status == 1) {
                console.log(sql,'sql')
                sql = sql.replace(/`/g,'')
                const query = new QueryStream(sql)
                const stream = db.connection.query(query) .on('error', function (err) {
                    console.log(err)
                    reject(err)
                })

                stream.on('error', (err) => {
                    console.error('Stream error:', err);
                    reject(err)
                });

                stream.on('data', (row) => {
                    //console.log(row)
                    data.push(row)
                })

                stream.on('end', () => {
                    //console.log('done')
                    resolve(data)
                })

            } else {
                reject(0)
            }
        });
    });
}
exports.addPolColumn = async function (config, table) {

    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {

            if (db && db.status == 1) {
                db.connection.query("ALTER TABLE " + table + " ADD COLUMN pol SERIAL PRIMARY KEY"
                    , function (error, results, fields) {
                        console.log(results, fields, 'o o o o  o o o o o')
                        if (results) {

                            resolve()
                        } else {
                            reject(0)
                        }
                    });

            } else {
                reject(0)
            }
        });
    });
}