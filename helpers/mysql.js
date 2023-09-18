var mysql = require('mysql2');
const stream = require('stream');
const { createPool } = require('mysql2');
const BatchStream = require('batch-stream');


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
                console.log('connection here 11111')
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
async function makeConnection(config) {
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
    });
}

exports.getTablesListOfDatabase = async function (config) {
    return new Promise((resolve, reject) => {
        makeConnection(config).then((db) => {
            // console.log(db, 'connection mysql')
            if (db) {
                var q = "SELECT table_name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '" + config.database + "'";

                db.connection.query(q, function (error, results, fields) {
                    // console.log(q,'here in hhh')
                    if (error) {
                        reject({
                            message: error,
                            status: 0
                        });
                    } else {
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
                        console.log(results)
                        if (results.length > 0) {
                            var cols = results.map((e) => e.COLUMN_NAME)
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

// exports.getTableData = async function (config,table) {

// 	return new Promise(async (resolve, reject) => {
//         makeConnection(config).then((db) => {
//             var data = [];
//             if (db && db.status == 1) {
//                 db.connection.query("SELECT * from " + table)
//                 .on('error', function (err) {
//                     // Do something about error in the query
//                 })
//                 .stream()
//                 .pipe(new stream.Transform({
//                     objectMode: true,
//                     transform: function (row, encoding, callback) {
//                     console.log(row, 'row')
//                     if (data.length == 0) {
//                         // res.write('{"status":1,"data":['+JSON.stringify(row));
//                     } else {
//                         // res.write(","+JSON.stringify(row));

//                     }
//                     data.push(row);
//                     callback();

//                     }
//                 }))
//                 .on('finish', function () {
//                     //res.write("]}");

//                     db.connection.end();
//                     resolve(data)
//                     // res.end()
//                    // res.send({ status: 1, data: data });
//                 });

//             } else {
//                 reject(0)
//             }
//         });
// 	});
// }

exports.getTableData = async function (config, table) {

    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {
            var data = [];
            if (db && db.status == 1) {
                // use batch processing to retrieve the data
                const batchSize = 50000; // process two rows at a time
                const batchStream = new BatchStream({ size: batchSize });

                db.connection.query("SELECT * from " + table)
                    .stream({ highWaterMark: batchSize })
                    .pipe(batchStream)
                    .on('data', function (batch) {
                        //console.log('Received batch:', batch);
                        // process the batch of rows
                        //data.concat(batch);
                        console.log('fetched batch',batch.length)
                        data = [...data, ...batch]
                    })
                    .on('end', function () {
                        console.log('Finished processing all rows.', data.length);
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
                // db.connection.query(sql)
                //     .on('error', function (err) {
                //         console.log(err,'errrr')
                //        // reject(0)
                       
                //     })
                //     .stream()
                //     .pipe(new stream.Transform({
                //         objectMode: true,
                //         transform: function (row, encoding, callback) {
                           
                //             data.push(row);
                //             callback();

                //         }
                //     }))
                //     .on('finish', function () {
                //         db.connection.end();
                //         resolve(data)
                       
                //     });

                const query = db.connection.query(sql).on('error', function (err) {
                    console.log(err)
                    reject(err)
                });
                const stream = query.stream();
              
                // Handle stream errors
                stream.on('error', (err) => {
                  console.error('Stream error:', err);
                  reject(err)
                });
              
                // Process data from the stream
                stream.on('data', (row) => {
                  // Process each row
                  data.push(row);
                });
              
                // Release the connection back to the pool when finished
                stream.on('end', () => {
                    db.connection.end();
                  console.log('Stream ended');
                  resolve(data)
                  
                });
              
           
              
              
              

              

            } else {
                reject(0)
            }
        });
    });

};

//get and return if there is some unique,primary etc column exist or not
exports.addPolColumn = async function (config, table) {

    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {

            if (db && db.status == 1) {
                db.connection.query("ALTER TABLE " + table + " ADD COLUMN pol int AUTO_INCREMENT PRIMARY KEY"
                    , function (error, results, fields) {
                        console.log(results, fields, 'o o o o  o o o o o')
                        if (results) {
                            resolve({ results: results, fields: fields })
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
