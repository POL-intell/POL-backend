const { Client } = require('pg')
const QueryStream = require('pg-query-stream')
const BatchStream = require('batch-stream');
const { resolveHostname } = require('nodemailer/lib/shared');

/*create connection to database by host,user,password and database. For this mysql2 package is used tomake connection to mysql */
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
                resolve({
                    connection: client,
                    status: 1
                });

            })
            .catch(err => {
                reject({
                    message: err,
                    status: 0
                });
            });
    }).catch(error => {
        console.log('err post')
    });

}

/* To make connection with database*/
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
                reject({
                    message: err,
                    status: 0
                });
            })
            .catch(err => {
                resolve({
                    connection: client,
                    status: 1
                });
            });



    }).catch(error => {
        console.log('err post')
    });
}

/* To get the tables list in database*/
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

/* To find unique key in database*/
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

/* To get the data from a table*/
exports.getTableData = async function (config, table) {
    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {
            var data = [];
            if (db && db.status == 1) {
                const batchSize = 50000; // process two rows at a time
                const batchStream = new BatchStream({ size: batchSize });
                const tableName = table;
                // Safely construct the query using string interpolation
                const query = `SELECT * FROM "${tableName}"`;
                const queryStream = new QueryStream(query);
                const stream = db.connection.query(queryStream)

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


/*To execute data links (queries) and return response*/
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


/* To add a unique col name pol in table, If unique key not exist */
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

/* To check user permission to update database or tables  */
exports.checkPrivilige = async function(config,table){
    return new Promise((resolve,reject)=>{
        console.log("config",config)
        makeConnection(config).then((db) =>{
            if(db && db.status ==1){
                let q = `SELECT COUNT(*) FROM information_schema.role_table_grants WHERE grantee=$1 AND privilege_type=$2 AND table_catalog=$3 AND is_grantable=$4 AND table_name =$5;`
                db.connection.query(q, function (error, results) {
                    if (error) {
                        reject({status:0})
                    } else {
                       console.log("results",results)
                    //    resolve({status:1})
                    }
                });
            }else{
                reject(0)
            }
        })
    })
}

/* To create a result table in database */
exports.createResultTable = function (dbDetails, tableName, totalRows, columnName) {
    return new Promise((resolve, reject) => {
        makeConnection(dbDetails)
            .then((client) => {
                if (client) {
                    const createTableQuery = `CREATE TABLE "${tableName}" (pol SERIAL PRIMARY KEY, "${columnName}" VARCHAR(255));`

                    client.connection.query(createTableQuery, (createTableError, createTableResult) => {
                        if (createTableError) {
                            reject({ status: 0, error: createTableError });
                        } else {

                        const batchSize = 5000;
                        const totalBatches = Math.ceil(totalRows / batchSize);
                        console.log("totalBatches", totalBatches);
                        const insertQueries = Array.from({ length: totalBatches }, (_, index) => {
                            const start = index * batchSize + 1;
                            const end = Math.min(start + batchSize - 1, totalRows);
                            return `INSERT INTO "${tableName}" ("${columnName}") VALUES ${Array.from({ length: end - start + 1 }, (_, i) => `(NULL)`)
                                .join(',')};`;
                        });

                        let insertionPromises = insertQueries.map((query) => {
                            return new Promise((resolve, reject) => {
                                client.connection.query(query, function (insertError, insertResult) {
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
                                    client.connection.query('COMMIT', (commitError) => {
                                        if (commitError) {
                                            reject({ status: 0, error: commitError });
                                        } else {
                                            resolve({ status: 1, message: 'Table created and rows inserted successfully.' });
                                        }
                                    });
                                })
                                .catch((error) => {
                                    client.connection.query('ROLLBACK', () => {
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

/* To check for duplicate table names */
exports.checkTableExistence = async function(dbDetails, tableName){
    return new Promise((resolve,reject)=>{
        makeConnection(dbDetails).then((client) => {
            // const checkTableQuery = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1;`
            const checkTableQuery = `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1;`

            const params = [tableName];
            client.connection.query(checkTableQuery,params, (err, result) => {
                if (err) {
                    reject({status:0});
                } else {
                    console.log("result",result,typeof parseInt(result.rows[0].count))
                    if(parseInt(result.rows[0].count)>0){
                        resolve({status:1});
                    }else{
                        reject({status:0})
                    }
                }
            });
        })
    })
}

/* To check for duplicate column names in table */
exports.checkColumnExistence = async function(dbDetails, tableName, columnName) {
    return new Promise((resolve, reject) => {
        makeConnection(dbDetails).then(async (client) => {
            const checkTableQuery = `SELECT COUNT(*) FROM information_schema.columns WHERE table_catalog = $1 AND table_name = $2 AND column_name = $3;`;
            const params = [dbDetails.database,tableName,columnName];
            console.log("dbDetails.database",params)

            client.connection.query(checkTableQuery, params, (err, result) => {
                if (err) {
                    console.log("error here in checkColumnExistence", err);
                    reject(err);
                } else {
                    console.log("result",result,typeof parseInt(result.rows[0].count),parseInt(result.rows[0].count)>0)

                    if(parseInt(result.rows[0].count)>0){
                        console.log("in if")
                        resolve({status:1});
                    }else{
                        console.log("in else")
                        reject({status:0})
                    }
                }
            });
        })
        .catch((error) => {
            reject({ status: 0 });
        });
    });
};

/* To crteate new column name in table */
exports.createColumn = async function (dbDetails, tableName, columnName) {
    return new Promise((resolve,reject)=>{
        makeConnection(dbDetails).then(async (client) => {
            await client.connection.query('BEGIN');

            const createColumnStmt = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} TEXT DEFAULT NULL;`;

            await client.connection.query(createColumnStmt);
            await client.connection.query('COMMIT');

            resolve ({ status: 1});
        })
        .catch((error) => {
            reject({ status: 0});
        });
    })
      
};
