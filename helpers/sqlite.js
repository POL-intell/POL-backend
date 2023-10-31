var mysql = require('mysql2');
const stream = require('stream');
const { createPool } = require('mysql2');
const BatchStream = require('batch-stream');
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
const currentDirectory = __dirname;
const filePath = path.join(currentDirectory, '../controllers/sqlite-sakila.db');
let dbConnection = null;
//create connection to database by host,user,password and database. For this mysql2 package is used tomake connection to mysql 
exports.createConnection = async function (config) {
    config.dbPath = filePath
    return new Promise((resolve, reject) => {
        console.log("dbConnection:>>>",dbConnection)
        if(!dbConnection){
            dbConnection =  new sqlite3.Database(config.dbPath,sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.log(err, 'err here')
                    reject({
                        message: err,
                        status: 0
                    });
                } else {
                    console.log('connection here 11111')
                }
            });
            resolve({
                connection: dbConnection,
                status: 1
            });
        }else{
            resolve({
                connection: dbConnection,
                status: 1
            });
        }
        console.log("connection",dbConnection)
		
    }).catch(error => {
        console.log('eee22', 'error', error)

    });


}
async function makeConnection(config) {
    console.log("In makeconnection")
    config.dbPath = filePath
    return new Promise((resolve, reject) => {
        dbConnection =  new sqlite3.Database(config.dbPath, sqlite3.OPEN_READWRITE , (err) => {
            if (err) {
                console.log(err, 'err here')
                reject({
                    message: err,
                    status: 0
                });
            } 
        });
        if(dbConnection){
            resolve(dbConnection);
        }
        console.log("connection",dbConnection)
    });
}

exports.getTablesListOfDatabase = async function (config) {
    config.dbPath = filePath
    return new Promise(async(resolve, reject) => {

                if (!dbConnection) {
                    dbConnection = await makeConnection(config);
                }

                if(dbConnection){
                    console.log("dbConnection",dbConnection)
                    var q = "SELECT name FROM sqlite_master WHERE type='table'";
                    dbConnection.serialize(function () {
                    dbConnection.all(q, (err, rows) => {
                        if (err) {
                            console.error(`Error executing query: ${err.message}`);
                            reject({
                              message: err,
                              status: 0
                              });
                        }
                        console.log("rows",rows)
                        const renamedData = rows.map(obj => {
                            // Create a new object with ']tableName' key and the value of 'name'
                            return { 'TABLE_NAME': obj['name'] };
                          });
    
                        resolve({
                            result: renamedData,
                            status: 1
                        });
                    });
                })
                }


    });
}



exports.getTableData = async function (config, table) {
    config.dbPath = filePath
    return new Promise(async (resolve, reject) => {
        try {
            if (!dbConnection) {
                dbConnection = await makeConnection(config);
            }
            console.log(dbConnection,dbConnection)
            const batchSize = 50000;
            const rowCount = await getRowCount(dbConnection, table);
            const data = [];
            for (let offset = 0; offset < rowCount; offset += batchSize) {
                console.log("offset",offset)
                const batch = await fetchDataBatch(dbConnection, table, batchSize, offset);
                data.push(...batch);
            }
            resolve(data);
         
        } catch (error) {
            reject(error);
        }
    });
}

async function getRowCount(connection, table) {
    return new Promise((resolve, reject) => {
        connection.get("SELECT COUNT(*) as count FROM " + table, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });
}

async function fetchDataBatch(connection, table, batchSize, offset) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM ${table} LIMIT ${batchSize} OFFSET ${offset}`;
        connection.all(query, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

exports.getSqlData = async function (config, sql) {
    config.dbPath = filePath
    return new Promise(async (resolve, reject) => {
        if (!dbConnection) {
            dbConnection = await makeConnection(config);
        }
        var data = [];
        const query = dbConnection.all(sql).on('error', function (err) {
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
            dbConnection.end();
            console.log('Stream ended');
            resolve(data)
            
        });
    });

};

exports.addPolColumn = async function (config, table) {
    config.dbPath = filePath
    return new Promise(async (resolve, reject) => {
        if (!dbConnection) {
            dbConnection = await makeConnection(config);
        }
        dbConnection.all("ALTER TABLE " + table + " ADD COLUMN pol INTEGER UNIQUE AUTOINCREMENT",function (error, results, fields) {
                console.log(results, fields, 'o o o o  o o o o o')
                if (error) {
                    console.log("error",error)
                    reject(0)
                } else {
                    resolve({ results: results, fields: fields })

                }
        }); 
    });
}

exports.getUniqueCol = async function (config, table) {
    config.dbPath = filePath
    return new Promise(async (resolve, reject) => {
        if (!dbConnection) {
            dbConnection = await makeConnection(config);
        }
        // let q = "SELECT K.COLUMN_NAME, T.CONSTRAINT_TYPE FROM ( SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, 'PRIMARY KEY' AS CONSTRAINT_TYPE FROM sqlite_master WHERE type = 'table'   AND sql LIKE '%PRIMARY KEY%' UNION SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, 'FOREIGN KEY' AS CONSTRAINT_TYPE FROM sqlite_master WHERE type = 'table'   AND sql LIKE '%FOREIGN KEY%') AS T JOIN ( SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, sql AS COLUMN_NAME FROM sqlite_master WHERE type = 'index' AND sql LIKE 'CREATE UNIQUE INDEX%') AS K ON K.TABLE_NAME = T.TABLE_NAME AND K.CONSTRAINT_NAME = T.CONSTRAINT_NAME WHERE T.TABLE_NAME = '" + table + "' ;"
        let q1 = `PRAGMA table_info(${table})`;
        dbConnection.all(q1, async function (error, rows) {
            if(error){
                let q2= `PRAGMA index_list(${table})`;
                dbConnection.all(q2, async function (error, rows) {
                    if(error){
                        reject({status:0})
                    }
                    var cols = []
                    console.log("rows",rows)
                    if(rows.length >0 ){
                        for (const row of rows) {
                            if (row.unique == 1) {
                                let q3 = `PRAGMA index_info(${row.name});`;
                                dbConnection.all(q3, function(err,result){
                                    if(err){
                                        reject({status:0})
                                    }
                                    let col_name = result[0]?.name
                                    cols.push(col_name)
                                    console.log("cols",cols)
                                    resolve({ cols: cols,status:1 })
                                })
                                break;
                            }else{
                                console.log("cols",cols)
                                resolve({ cols: cols, status:1 })
                            }                                                      
                        }
                    }else{
                        reject({status:0})
                    }
                    
                });
            }else{
                const primaryKeyColumns = rows.filter(column => column.pk === 1).map(column => column.name);
                console.log("primary",primaryKeyColumns)
                if(primaryKeyColumns.length > 0){
                    resolve({ cols: primaryKeyColumns, status:1 })
                }else{
                    reject({status:0})
                }
            }
        });    
    });
}




exports.createResultTable = function (dbDetails, tableName, totalRows, columnName) {
    return new Promise(async (resolve, reject) => {
       
        try {
            if(!dbConnection){
                dbConnection = await makeConnection(dbDetails);
            }

            // Create table statement
            const createTableStmt = `CREATE TABLE ${tableName} ("pol" INTEGER PRIMARY KEY AUTOINCREMENT, ${columnName} TEXT);`;

            // Execute table creation statement
            dbConnection.run(createTableStmt, (err) => {
                if (err) {
                    reject({ status: 0, error: err.message });
                    return;
                }

                console.log(`Table ${tableName} created successfully.`);

                // Insert data into the created table in batches
                const batchSize = 5000;
                const totalBatches = Math.ceil(totalRows / batchSize);

                dbConnection.serialize(() => {
                    dbConnection.run('BEGIN'); // Begin the transaction

                    // Insert rows in batches
                    for (let i = 0; i < totalBatches; i++) {
                        const rowsInThisBatch = Math.min(batchSize, totalRows - i * batchSize);
                        const values = Array.from({ length: rowsInThisBatch }, (_, j) => null);
                        const placeholders = Array.from({ length: rowsInThisBatch }, () => '(?)').join(',');
                        const insertQuery = `INSERT INTO ${tableName} (${columnName}) VALUES ${placeholders}`;

                        dbConnection.run(insertQuery, values, (err) => {
                            if (err) {
                                dbConnection.run('ROLLBACK', () => { // Roll back the transaction in case of error
                                    reject({ status: 0, error: err });
                                });
                            } else {
                                if (i === totalBatches - 1) {
                                    // If this is the last batch, commit the transaction
                                    dbConnection.run('COMMIT', () => {
                                        resolve({ status: 1, message: 'Table created and rows inserted successfully.' });
                                    });
                                }
                            }
                        });
                    }
                });
            });
        } catch (error) {
           
            reject({ status: 0, error: error.message });
        }
    });
};

exports.checkTableExistence= async function(dbDetails, tableName) {

    return new Promise(async (resolve, reject) => {
        if (!dbConnection) {
            dbConnection = await makeConnection(dbDetails);
        }
        const checkTableQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
        console.log("checkTableQuery",checkTableQuery)
        dbConnection.get(checkTableQuery, (err, row) => {
            if(err) {
                console.log("in error",err)
                reject(err);
            }else {
                console.log("in res",row)
                if(row){
                    resolve(row ? true : false);
                }else{
                    reject({status:0})
                }
            }
        });
    });
}


exports.checkColumnExistence = async function(dbDetails, tableName, columnName) {
    return new Promise(async(resolve, reject) => {
        if (!dbConnection) {
            dbConnection = await makeConnection(dbDetails);
        }
        const checkTableQuery = `PRAGMA table_info(${tableName});`;

        dbConnection.all(checkTableQuery, (checkColumnError, checkColumnResult) => {
            if (checkColumnError) {
                console.log('checkColumnError', checkColumnError);
                reject(checkColumnError);
            } else {
                const columnNames = checkColumnResult.map((column) => column.name);
                if (columnNames.includes(columnName)) {
                    resolve(checkColumnResult);
                } else {
                    reject(0);
                }
            }
        });
    });
};



exports.createColumn = async function (dbDetails, tableName, columnName) {

    return new Promise(async (resolve, reject) => {
        if (!dbConnection) {
            dbConnection = await makeConnection(dbDetails);
        }
        dbConnection.serialize(() => {
            dbConnection.run('BEGIN TRANSACTION');

            const createColumnStmt = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} TEXT DEFAULT NULL;`;

            dbConnection.run(createColumnStmt, [], function (err) {
                if (err) {
                    dbConnection.run('ROLLBACK');
                    reject({ status: 0, error: err.message });
                } else {
                    dbConnection.run('COMMIT');
                    resolve({ status: 1,});
                }
            });
        });

    });
};
