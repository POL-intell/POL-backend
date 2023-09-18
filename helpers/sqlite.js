var mysql = require('mysql2');
const stream = require('stream');
const { createPool } = require('mysql2');
const BatchStream = require('batch-stream');
const sqlite3 = require('sqlite');

//create connection to database by host,user,password and database. For this mysql2 package is used tomake connection to mysql 
exports.createConnection = async function (config) {
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
        console.log('eee', 'error', error)

    });


}
async function makeConnection(config) {
    return new Promise((resolve, reject) => {
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
    });
}

exports.getTablesListOfDatabase = async function (config) {
    console.log("config",config)
    return new Promise((resolve, reject) => {
        makeConnection(config).then((db) => {
            if (db) {
                var q = "SELECT name FROM sqlite_master WHERE type='table'";
                console.log("q",q)
                db.connection.all(q, (err, rows) => {
                    console.log("rows",rows)
                    const renamedData = rows.map(obj => {
                        // Create a new object with 'tableName' key and the value of 'name'
                        return { 'TABLE_NAME': obj['name'] };
                      });
                    if (err) {
                      console.error(`Error executing query: ${err.message}`);
                      reject({
                        message: error,
                        status: 0
                    });
                    }
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
        }).catch((err) => console.log(err, 'errrrrr'));;
    });
}

exports.getUniqueCol = async function (config, table) {
    return new Promise(async (resolve, reject) => {
        makeConnection(config).then((db) => {
            if (db && db.status == 1) {
                db.connection.all("SELECT K.COLUMN_NAME, T.CONSTRAINT_TYPE FROM ( SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, 'PRIMARY KEY' AS CONSTRAINT_TYPE FROM sqlite_master WHERE type = 'table'   AND sql LIKE '%PRIMARY KEY%' UNION SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, 'FOREIGN KEY' AS CONSTRAINT_TYPE FROM sqlite_master WHERE type = 'table'   AND sql LIKE '%FOREIGN KEY%') AS T JOIN ( SELECT tbl_name AS TABLE_NAME, name AS CONSTRAINT_NAME, sql AS COLUMN_NAME FROM sqlite_master WHERE type = 'index' AND sql LIKE 'CREATE UNIQUE INDEX%') AS K ON K.TABLE_NAME = T.TABLE_NAME AND K.CONSTRAINT_NAME = T.CONSTRAINT_NAME WHERE T.TABLE_NAME = '" + table + "' ;"
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

exports.getTableData = async function (config, table) {
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


