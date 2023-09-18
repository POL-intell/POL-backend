var express = require('express');
var router = express.Router();
//var Database = require('../models/Database');
var DBHelper = require('../helpers/db');
const stream = require('stream');
const { createPool } = require('mysql2');
var MySQl = require('../helpers/mysql');
var PostgreSQL = require('../helpers/postgres');
const SqlLite = require('../helpers/sqlite');
const path = require('path')
const desktopPath = require('os').homedir()
/**Add database and create connection to check id DB is connectting or not*/
exports.addDatabase = async function (req, res) {
  
  var data = req.body
  const filePath = path.join(desktopPath, '/Desktop/sqlite-sakila.db');
  data.dbPath = filePath
  var connection = await DBHelper.createConnection(data);

  if (connection && connection.status == 1) {
    res.status(200).send({
      message: "Connection has been set successfully",
      status: 1
    });
  } else {
    res.status(500).send({
      message: "Connection has not been set ",
      detail: connection,
      status: 1
    });
  }
};


/**Get the table slist from database details*/
exports.getTables = async function (req, res) {
  
  var data = req.body

  if (data.type == 'PostgreSQL') {
    var result = await PostgreSQL.getTablesListOfDatabase(data)

    res.status(200).send({
      status: 1,
      data: result.result
    });
  } else if (data.type == 'MySQL') {
    var result = await MySQl.getTablesListOfDatabase(data)

    res.status(200).send({
      status: 1,
      data: result.result
    });
  }else if (data.type == 'SQLite') {
    const filePath = path.join(desktopPath, '/Desktop/sqlite-sakila.db');
    data.dbPath = filePath
    var result = await SqlLite.getTablesListOfDatabase(data)
    res.status(200).send({
      status: 1,
      data: result.result
    });
  }else {
    res.status(500).send({
      message: "Wrong DB Type",
      status: 0
    });
  }

};


/**get the table slist from database details*/
// exports.listTables = async function (req, res) {
//   let { db_id } = req.params;
//   let db = await Database.where({ 'id': db_id }).fetch();
//   db = db.toJSON();
//   var DB = await DBHelper.createConnection(db);


//   let connection = DB.connection;
//   connection.query("SELECT table_name, table_rows FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = " + db.database, function (error, results, fields) {
//     if (error) {
//       res.status(500).send({
//         message: error,
//         status: 0
//       });
//     } else {
//       res.status(200).send({
//         status: 1,
//         data: results
//       });
//     }
//   });
//   connection.end();
// }

/**get the meta data of table*/
exports.getMetaData = async function (req, res) {

  var data = req.body;
  let { table } = req.params;
  try {
    if (data.type == 'PostgreSQL') {
      var uniqueCall = await PostgreSQL.getUniqueCol(req.body, table);
      res.status(200).send({
        status: 1,
      });
    } else if (data.type == 'MySQL') {
      var uniqueCall = await MySQl.getUniqueCol(req.body, table);
      res.status(200).send({
        status: 1,
      });
    }
    else if (data.type == 'SQLite') {
      const filePath = path.join(desktopPath, '/Desktop/sqlite-sakila.db');
      data.dbPath = filePath
      var uniqueCall = await SqlLite.getUniqueCol(req.body, table);
      res.status(200).send({
        status: 1,
      });
    } else {
      res.status(200).send({
        status: 0,
        data: [],
        message: "Wrong DB Type"
      });
      return;
    }

  } catch (e) {
    res.status(200).send({
      status: 0,
      data: [],
      message: "POL need at least one column of unique key to work, since no such column found, POL column must be added to the database table. Are you agree to this modification?"
    });
    return;
  }
}

/**get the data from a table */
exports.getTableData = async function (req, res) {
  let { table } = req.params;
  var data = req.body.dbDetails;
    try {
      if (data.type == 'PostgreSQL') {
        var results = await PostgreSQL.getTableData(data, table);
        res.status(200).send({
          status: 1,
          data: results
        });
      } else if (data.type == 'MySQL') {
        var results = await MySQl.getTableData(data, table);
        console.log('comes here ')
        res.status(200).send({
          status: 1,
          data: results
        });
      }else if (data.type == 'SQLite') {
        const filePath = path.join(desktopPath, '/Desktop/sqlite-sakila.db');
        data.dbPath = filePath
        var results = await SqlLite.getTableData(data, table);
        console.log('comes here ')
        res.status(200).send({
          status: 1,
          data: results
        });
      } else {
        res.status(200).send({
          status: 0,
          data: [],
          message: "Wrong DB Type"
        });
        return;
      }
 

      } catch (e) {
        res.status(200).send({
          status: 0,
          data: [],
          message: e
        });
        return;
      }

  // let { table } = req.params;
  // var db = req.body;
  // var from = 0;
  // if (req.body.from) {
  //   from = req.body.from;
  // }
  // var to = 20;
  // if (req.body.to) {
  //   to = req.body.to;
  // }
  // if (req.body.dbDetails) {
  //   db = req.body.dbDetails;
  // }


  // var DB = DBHelper.makeConnections(db);
  // DB.then((result) => {
  //   var connection = result.connection;
  //   var data = [];
  //   console.log("SELECT * from `" + table + "` LIMIT " + from + " , " + to + " ")
  //   connection.query("SELECT * from " + table)
  //     .on('error', function (err) {
  //       // Do something about error in the query
  //     })
  //     .stream()
  //     .pipe(new stream.Transform({
  //       objectMode: true,
  //       transform: function (row, encoding, callback) {
  //         console.log(row, 'row')
  //         if (data.length == 0) {
  //           // res.write('{"status":1,"data":['+JSON.stringify(row));
  //         } else {
  //           // res.write(","+JSON.stringify(row));

  //         }
  //         data.push(row);
  //         callback();

  //       }
  //     }))
  //     .on('finish', function () {
  //       //res.write("]}");

  //       connection.end();
  //       // res.end()
  //       res.send({ status: 1, data: data });
  //     });

  // }).catch((error) => {
  //   console.log(error, 'error')
  //   res.status(500).send({
  //     message: error,
  //     status: 0
  //   });
  // })
}
/**get the sql result of a table*/
exports.getSqlData = async function (req, res) {

  var data = req.body.dbDetails;
  var {sql} = req.body
  try {
  if (data.type == 'PostgreSQL') {
    var results = await PostgreSQL.getSqlData(data,sql);
    res.status(200).send({
      status: 1,
      data: results
    });
  } else if (data.type == 'MySQL') {
    var results = await MySQl.getSqlData(data,sql);
    res.status(200).send({
      status: 1,
      data: results
    });
  } else {
    res.status(200).send({
      status: 0,
      data: [],
      message: "Wrong DB Type"
    });
    return;
  }
 

  } catch (e) {
    res.status(200).send({
      status: 0,
      data: [],
      message: e
    });
    return;
  }

};


/**Get the value of cell by  row and col*/
exports.getColRowValue = async function (req, res) {
  var db = req.body.dbDetails;
  let { table, col, row } = req.params;


  var cols = await DBHelper.getTableColumns({
    host: db.host,
    user: db.username,
    password: db.password,
    database: db.database,
    table: table

  });

  var col_name = cols.columns[col]

  var DB = DBHelper.createConnection({
    host: db.host,
    username: db.username,
    password: db.password,
    database: db.database,

  });

  DB.then((result) => {
    var connection = result.connection;

    var r = res;
    var query = 'select ' + col_name + ' from ' + table + ' limit ' + parseInt(row - 1) + ',1';
    if (row == 1) {
      query = 'select ' + col_name + ' from ' + table + ' limit ' + row;
    }
    connection.query(query, function (error, results, fields) {

      console.log('hhh', results)
      if (error) {
        res.status(500).send({
          message: error,
          status: 0
        });
      } else {
        var value = ""
        if (results.length > 0) {
          console.log(results[0])
          value = results[0][col_name];
        }
        r.status(200).send({
          status: 1,
          data: value
        });

      }
    });
    connection.end();
  }).catch((error) => {
    res.status(500).send({
      message: error,
      status: 0
    });
  })

};




/**rollback function get the output table and get the results from db and send them back*/
exports.rollbackPoll = async function (req, res) {
  var data = req.body;
  var output = [];
  for (var i = 0; i < data.length; i++) {
    var fn = data[i].function;
    var output_table_info = data[i].table;
    
    try{
      var resultSetR = await  DBHelper.getTableResultSet(output_table_info)
      resultSet = resultSetR.results
      output.push({ 'output_table': output_table_info.name, 'resultSet': resultSet })
    }catch(err){
      console.log("Error in rollbackPoll",err);
    }
  }
  res.status(200).send({
    status: 1,
    data: output
  });

}


/**Add pol column in the table*/
exports.addPolColumn = async function (req, res) {
  let { table } = req.params;
  try {
    var result = await DBHelper.addPolColumn(req.body, table);
    res.status(200).send({
      status: 1,
      message: 'Pol column added successfully.'
    });
  } catch (e) {
    res.status(200).send({
      status: 0,
      message: 'Something went wrong while adding column'
    });

  }
}

/**Add pol column in the multiple table*/
exports.addPolColumns = async function (req, res) {
  var functions = req.body.functions;




  for (var f = 0; f < functions.length; f++) {
      var fn = functions[f];
      var output_table_info = functions[f].table;
    try {

      var result = await DBHelper.addPolColumn(output_table_info.dbDetails, output_table_info.dbTable);
      res.status(200).send({
        status: 1,
        message: 'Pol column added successfully.'
      });

    }catch (e) {

      res.status(200).send({
        status: 0,
        message: 'Something went wrong while adding column'
      });

     
    }
  }
}


