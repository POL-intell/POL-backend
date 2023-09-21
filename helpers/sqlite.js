var mysql = require('mysql2');
const stream = require('stream');
const { createPool } = require('mysql2');
const BatchStream = require('batch-stream');
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
const currentDirectory = __dirname;
const filePath = path.join(currentDirectory, '../controllers/sqlite-sakila.db');
//create connection to database by host,user,password and database. For this mysql2 package is used tomake connection to mysql 
exports.createConnection = async function (config) {
    config.dbPath = filePath
    return new Promise((resolve, reject) => {
        let connection =  new sqlite3.Database(config.dbPath, (err) => {
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
        if(connection){
            resolve({
                connection: connection,
                status: 1
            });
        }
        console.log("connection",connection)
		
    }).catch(error => {
        console.log('eee22', 'error', error)

    });


}
async function makeConnection(config) {
    config.dbPath = filePath
    return new Promise(async (resolve, reject) => {
        const isLocked = await isDatabaseLocked(config);
        console.log("isLocked",isLocked)
        if (isLocked) {
            reject({
                message: "DataBase is Locked",
                status: 0
            });
        }else{
            let connection =  new sqlite3.Database(config.dbPath, (err) => {
                if (err) {
                    console.log(err, 'err here')
                    reject({
                        message: err,
                        status: 0
                    });
                } 
            });
            if(connection){
                resolve({
                    connection: connection,
                    status: 1
                });
            }
            console.log("connection",connection)
        }
    });
}


async function isDatabaseLocked(config) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(config.dbPath);

        db.serialize(() => {
            db.exec('PRAGMA lock_status;', (err) => {
                db.close();

                if (err) {
                    reject({
                        message: err.message,
                        status: 0
                    });
                } else {
                    resolve(true); // Database is not locked
                }
            });
        });
    });
}
exports.getTablesListOfDatabase = async function (config) {
    config.dbPath = filePath
    return new Promise((resolve, reject) => {
        makeConnection(config).then((db) => {
            if (db) {
                var q = "SELECT name FROM sqlite_master WHERE type='table'";
                console.log("q",q)
                db.connection.all(q, (err, rows) => {
                    if (err) {
                        console.error(`Error executing query: ${err.message}`);
                        reject({
                          message: error,
                          status: 0
                          });
                      }
                    console.log("rows",rows)
                    const renamedData = rows.map(obj => {
                        // Create a new object with 'tableName' key and the value of 'name'
                        return { 'TABLE_NAME': obj['name'] };
                      });

                    resolve({
                        result: renamedData,
                        status: 1
                    });
                  });

            } else {
                console.log('here reject')
                reject({
                    message: "error",
                    status: 0
                });

            }
        }).catch((err) => {
            console.log(err, 'errrrrr>>>>>>')
            resolve(err)
        });;
    });
}

// exports.getUniqueCol = async function (config, table) {
//     config.dbPath = filePath
//     return new Promise(async (resolve, reject) => {
//         makeConnection(config).then((db) => {
//             if (db && db.status == 1) {
//                 console.log("in db",db)
//                 // let q = "SELECT K.COLUMN_NAME, T.CONSTRAINT_TYPE FROM ( SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, 'PRIMARY KEY' AS CONSTRAINT_TYPE FROM sqlite_master WHERE type = 'table'   AND sql LIKE '%PRIMARY KEY%' UNION SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, 'FOREIGN KEY' AS CONSTRAINT_TYPE FROM sqlite_master WHERE type = 'table'   AND sql LIKE '%FOREIGN KEY%') AS T JOIN ( SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, sql AS COLUMN_NAME FROM sqlite_master WHERE type = 'index' AND sql LIKE 'CREATE UNIQUE INDEX%') AS K ON K.TABLE_NAME = T.TABLE_NAME AND K.CONSTRAINT_NAME = T.CONSTRAINT_NAME WHERE T.TABLE_NAME = '" + table + "' ;"
//                 let q = `PRAGMA index_list(${table});`;
//                 db.connection.all(q, function (error, results) {
//                     console.log(results)
//                     if(results.length > 0) {
//                         var cols = results.map((e) => e.COLUMN_NAME)
//                         resolve({ cols: cols })
//                     }else {
//                         reject(0)
//                     }
//                 });

//             } else {
//                 reject(0)
//             }
//         });
//     });
// }

exports.getTableData = async function (config, table) {
    config.dbPath = filePath
    return new Promise(async (resolve, reject) => {
        try {
            const db = await makeConnection(config);
            if (db && db.status === 1) {
                const batchSize = 50000;
                const rowCount = await getRowCount(db.connection, table);
                const data = [];

                for (let offset = 0; offset < rowCount; offset += batchSize) {
                    console.log("offset",offset)
                    const batch = await fetchDataBatch(db.connection, table, batchSize, offset);
                    data.push(...batch);
                }

                resolve(data);
            } else {
                reject(new Error('Failed to establish a database connection.'));
            }
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
        makeConnection(config).then((db) => {
            var data = [];
            console.log("db",db)
            if (db && db.status == 1) {
                const query = db.connection.all(sql).on('error', function (err) {
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

exports.addPolColumn = async function (config, table) {
    config.dbPath = filePath
    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {

            if (db && db.status == 1) {
                db.connection.all("ALTER TABLE " + table + " ADD COLUMN pol INTEGER PRIMARY KEY AUTO_INCREMENT"
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

exports.getUniqueCol = async function (config, table) {
    config.dbPath = filePath
    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {
            if (db && db.status == 1) {
                console.log("in db",db)
                // let q = "SELECT K.COLUMN_NAME, T.CONSTRAINT_TYPE FROM ( SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, 'PRIMARY KEY' AS CONSTRAINT_TYPE FROM sqlite_master WHERE type = 'table'   AND sql LIKE '%PRIMARY KEY%' UNION SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, 'FOREIGN KEY' AS CONSTRAINT_TYPE FROM sqlite_master WHERE type = 'table'   AND sql LIKE '%FOREIGN KEY%') AS T JOIN ( SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, sql AS COLUMN_NAME FROM sqlite_master WHERE type = 'index' AND sql LIKE 'CREATE UNIQUE INDEX%') AS K ON K.TABLE_NAME = T.TABLE_NAME AND K.CONSTRAINT_NAME = T.CONSTRAINT_NAME WHERE T.TABLE_NAME = '" + table + "' ;"
                let q = `PRAGMA index_list(${table});`;
                db.connection.all(q, async function (error, rows) {
                    console.log(rows)
                    if(error){
                        reject(0)
                    }
                    var cols = []
                    for (const row of rows) {
                        if (row.unique == 1) {
                            let q = `PRAGMA index_info(${row.name});`;
                            db.connection.all(q, function(err,result){
                                if(err){
                                    reject(0)
                                }
                                let col_name = result[0]?.name
                                cols.push(col_name)
                                console.log("cols",cols)
                                resolve({ cols: cols })
                            })
                            break;
                        }
                    }
                    
                });

            } else {
                reject(0)
            }
        });
    });
}

  