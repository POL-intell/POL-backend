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
        console.log('eee11', 'error', error)

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
                var q = "SELECT table_name, table_rows FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '" + config.database + "'";

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
                            resolve({ cols: cols, status:1 })
                        } else {
                            reject({status:0})
                        }
                    });

            } else {
                reject({status:0})
            }
        });
    });
}

exports.getTableData = async function (config, table) {

    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {
            var data = [];
            if (db && db.status == 1) {
                // use batch processing to retrieve the data
                const batchSize = 50000; // process two rows at a time
                const batchStream = new BatchStream({ size: batchSize });
                let q= `SELECT * from  \`${table}\` `
                db.connection.query(q)
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


exports.checkPrivilige = async function(config,table){
    return new Promise((resolve,reject)=>{
        console.log("config",config)
        makeConnection(config).then((db) =>{
            if(db && db.status ==1){
                let q1 = `SELECT * FROM mysql.user WHERE USER = "${config.username}" AND Update_priv = 'Y' AND DB= "${config.database}"`
                db.connection.query(q1, function (error, results) {
                    if(error){
                        console.log("error",error)
                        resolve({status:0}) 
                    }else{
                        if(results.length>0){
                            resolve({status:1})
                        }else{
                            let q2= `SELECT * FROM mysql.db WHERE USER = "${config.username}" AND Update_priv = 'Y' AND DB= "${config.database}"`
                            db.connection.query(q2, function (error, results) {
                                if (error) {
                                    reject({status:0})
                                } else {
                                    if(results.length > 0){
                                        resolve({status:1})
                                    }else{
                                    db.connection.query(`SELECT Table_priv FROM mysql.tables_priv WHERE USER = "${config.username}" AND DB= "${config.database}" AND TABLE_NAME = ${table}`
                                    , function (error, results) {
                                        if (error) {
                                            reject({status:0})
                                        } else {
                                            const array = results[0].Table_priv.split(',')                                
                                            if(array.includes('Update')){
                                                resolve({status:1})
                                            }else{
                                                reject({status:0})
                                            }
                                        }
                                    });
                                    }
                                }
                            });
                        }
                    }
                    
                })

              
            }else{
                reject(0)
            }
        })
    })
}

exports.createResultTable = function (dbDetails, tableName, totalRows, columnName) {
    console.log("columnName",columnName)
    return new Promise((resolve, reject) => {
        makeConnection(dbDetails)
            .then((db) => {
                if (db && db.status === 1) {
                 
                    const createTableQuery = `CREATE TABLE \`${tableName}\` (pol INT AUTO_INCREMENT PRIMARY KEY, \`${columnName}\` VARCHAR(255))`;

                    db.connection.query(createTableQuery, [tableName,columnName],function (createTableError, createTableResult) {
                        if (createTableError) {
                            reject({ status: 0, error: createTableError });
                        } else {
                            const batchSize = 5000;
                            const totalBatches = Math.ceil(totalRows / batchSize);
                            console.log("totalBatches", totalBatches);
                            const insertQueries = Array.from({ length: totalBatches }, (_, index) => {
                                const start = index * batchSize + 1;
                                const end = Math.min(start + batchSize - 1, totalRows);
                                return `INSERT INTO \`${tableName}\` (\`${columnName}\`) VALUES ${Array.from({ length: end - start + 1 }, (_, i) => `(NULL)`)
                                    .join(',')};`;
                            });

                            let insertionPromises = insertQueries.map((query) => {
                                return new Promise((resolve, reject) => {
                                    db.connection.query(query, function (insertError, insertResult) {
                                        if (insertError) {
                                            reject(insertError);
                                        } else {
                                            resolve(insertResult);
                                        }
                                    });
                                });
                            });

                            Promise.all(insertionPromises)
                                .then(() => {
                                    db.connection.commit((commitError) => {
                                        if (commitError) {
                                            db.connection.rollback(() => {
                                                reject({ status: 0, error: commitError });
                                            });
                                        } else {
                                            db.connection.end(); // End the connection after committing the transaction
                                            resolve({ status: 1, message: 'Table created and rows inserted successfully.' });
                                        }
                                    });
                                })
                                .catch((error) => {
                                    db.connection.rollback(() => {
                                        reject({ status: 0, error: error });
                                    });
                                });
                        }
                    });
                } else {
                    reject({ status: 0, message: 'Failed to establish database connection.' });
                }
            })
            .catch((error) => {
                reject({ status: 0, error: error });
            });
    });
};

exports.checkTableExistence = async function (dbDetails, tableName) {
    return new Promise((resolve, reject) => {
        makeConnection(dbDetails)
            .then((db) => {
                if (db && db.status === 1) {
                    console.log("tableName",tableName)
                    const checkTableQuery = `SELECT table_name FROM information_schema.TABLES WHERE table_name = ?`;
                    console.log("checkTableQuery",checkTableQuery)
                    db.connection.query(checkTableQuery, [tableName], function (checkTableError, checkTableResult) {
                        if (checkTableError) {
                            console.log('checkTableError', checkTableError);
                            reject(checkTableError);
                        } else {
                            // Check if exactly one table with the provided tableName exists
                            console.log(checkTableResult)
                            if(checkTableResult.length >0){
                                resolve(checkTableResult);
                            }else{
                                reject(0)
                            }
                        }
                    });
                } else {
                    reject('Failed to establish database connection.');
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}


exports.checkColumnExistence = async function(dbDetails,tableName,columnName){
    return new Promise((resolve, reject) => {
        makeConnection(dbDetails)
            .then((db) => {
                if (db && db.status === 1) {
                    console.log("tableName",tableName)
                    const checkTableQuery = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA ="${dbDetails.database}" AND TABLE_NAME = "${tableName}" AND COLUMN_NAME = "${columnName}";`
                    console.log(checkTableQuery)
                    db.connection.query(checkTableQuery, function (checkColumnError, checkColumnResult) {
                        if (checkColumnError) {
                            console.log('checkColumnError', checkColumnError);
                            reject(checkColumnError);
                        } else {
                            // Check if exactly one table with the provided tableName exists
                            console.log(checkColumnResult)
                            if(checkColumnResult.length >0){
                                resolve(checkColumnResult);
                            }else{
                                reject(0)
                            }
                        }
                    });
                } else {
                    reject('Failed to establish database connection.');
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}


exports.createColumn = async function (dbDetails, tableName, columnName) {
    return makeConnection(dbDetails)
        .then((db) => {
            return new Promise((resolve, reject) => {
                db.connection.beginTransaction((beginErr) => {
                    if (beginErr) {
                        reject({ status: 0, error: beginErr });
                    } else {

                        const createColumnStmt = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` TEXT DEFAULT NULL;`;

                        db.connection.query(createColumnStmt, (err, result) => {
                            if (err) {
                                return db.connection.rollback(() => {
                                    
                                    reject({ status: 0, error: err.message });
                                });
                            }

                            db.connection.commit((commitErr) => {
                                if (commitErr) {
                                    return db.connection.rollback(() => {
                                        
                                        reject({ status: 0, error: commitErr.message });
                                    });
                                }

                                resolve({ status: 1, });
                            });
                        });
                    }
                });
            });
        })
        .catch((error) => {
            return Promise.reject({ status: 0, error: error });
        });
};


