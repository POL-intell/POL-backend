var express = require('express');
var router = express.Router();
//var Database = require('../models/Database');
var DBHelper = require('../helpers/db');
/* GET home page. */


exports.addDatabase = async function (req, res) {

  var data = req.body
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

exports.getTables = async function (req, res) {

  var data = req.body
  var db = await DBHelper.createConnection(data);


  if (db && db.status == 1) {

    db.connection.query("SELECT table_name, table_rows FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '" + data.database + "'", function (error, results, fields) {
      if (error) {
        res.status(500).send({
          message: error,
          status: 0
        });
      } else {
        res.status(200).send({
          status: 1,
          data: results
        });
      }
    });


  } else {

    res.status(500).send({
      message: "Connection has not been set ",
      detail: connection,
      status: 1
    });
  }
};

exports.listTables = async function (req, res) {
  let { db_id } = req.params;
  let db = await Database.where({ 'id': db_id }).fetch();
  db = db.toJSON();
  var DB = await DBHelper.createConnection(db);


  let connection = DB.connection;


  connection.query("SELECT table_name, table_rows FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = " + db.database, function (error, results, fields) {
    if (error) {
      res.status(500).send({
        message: error,
        status: 0
      });
    } else {
      res.status(200).send({
        status: 1,
        data: results
      });
    }
  });
  connection.end();



}

exports.getMetaData = async function (req, res) {
  let { table } = req.params;
  try {
    var uniqueCall = await DBHelper.getUniqueCol(req.body, table);
    res.status(200).send({
      status: 1,
    });
  } catch (e) {
    res.status(200).send({
      status: 0,
      data: [],
      message: "POL need at least one column of unique key to work, since no such column found, POL column must be added to the database table. Are you agree to this modification?"
    });
    return;
  }
}

exports.getTableData = async function (req, res) {
  let { table } = req.params;
  var db = req.body;
  var from = 0;
  if (req.body.from) {
    from = req.body.from;
  }
  var to = 20;
  if (req.body.to) {
    to = req.body.to;
  }
  if (req.body.dbDetails) {
    db = req.body.dbDetails;
  }


  var DB = DBHelper.createConnection(db);
  DB.then((result) => {
    var connection = result.connection;
    connection.query("SELECT * from `" + table + "` LIMIT " + from + " , " + to + " ", function (error, results, fields) {
      if (error) {
        res.status(500).send({
          message: error,
          status: 0
        });
      } else {
        res.status(200).send({
          status: 1,
          data: results
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

exports.getSqlData = async function (req, res) {

  var db = req.body.dbDetails;
  var sql = req.body.sql;
  var DB = DBHelper.createConnection(db);


  DB.then((result) => {
    var connection = result.connection;

    connection.query(sql + ' LIMIT 20', function (error, results, fields) {
      if (error) {
        res.status(500).send({
          message: error,
          status: 0
        });
      } else {
        res.status(200).send({
          status: 1,
          data: results
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

exports.insert = async function (req, res) {
  let { table } = req.params;

  var DB = DBHelper.createConnection({
    host: '104.198.98.208',
    username: 'roots',
    password: "roots@123",
    database: 'operations',

  });


  DB.then((result) => {

    var connection = result.connection
    for (var i = 1; i <= 1000; i++) {

   
      var q = "INSERT INTO   try   (c1,c3) VALUES ";
      for (var j = 1; j <= 500; j++) {
        let posts = {

          "c1": Math.floor(Math.random() * (999 - 100 + 1) + 100),
          "c3": Math.floor(Math.random() * (999 - 100 + 1) + 100)
        };

        q = q + ' ( ' + Math.floor(Math.random() * (999 - 100 + 1) + 100) + ' , '
        q = q + Math.floor(Math.random() * (999 - 100 + 1) + 100) + ' ) ';
        if (j < 500) {
          q = q + ','
        }

      }

      //  q=
      console.log(q);
      // return;
      let post = {};
      connection.query(q, post, function (error, results, fields) {

        console.log('error', error, results)

      });

    }
    connection.end();

  }).catch((error) => {
    console.log(error, 'errorerror')
    res.status(500).send({

      message: error,
      status: 0
    });
  })

};

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

exports.interpretor = async function (req, res) {

  var RSRC = 7;
  var fc = "Table1:[4,0]=Table1:[-1,0]+Table1:[0,-1]";

  var left_side = fc.split(']=')[0].split(':[').pop()
  var output_col = left_side[0]
  var EP = left_side[2]

  var right_side = fc.split(']=')[1].split(']').map((t) => t.split(':[').pop());
  right_side = right_side.filter(n => n)
  console.log('left side of function', left_side)
  console.log('right side of function', right_side)

  for (var i = 1; i <= RSRC; i++) {

    for (var r = 0; r < right_side.length; r++) {

      var pointer = right_side[r].split(',');
      var col = parseInt(output_col) + parseInt(pointer[0]);
      var row = i + parseInt(pointer[1]);
    }
    console.log('--')

  }

};
exports.skeleton = async function (req, res) {


  var fc = "Table1:[4,0]=Table1:[-1,0]+Table1:[0,-1]-Table2:[0,-1]";
  var pointers = fc.split(']=')[1].split(']');
  var skeletons = '';
  for (var i = 0; i < pointers.length; i++) {
    if (pointers[i] != '') {

      if (i == 0) {
        skeletons = '~';
      } else {
        skeletons = skeletons + pointers[i][0] + '~';
      }
    }
  }

  return skeletons;
}

async function getTableResultSet(data) {
  //var data = req.body
  return new Promise(async (resolve, reject) => {

    var db = await DBHelper.createConnection(data.dbDetails);


    if (db && db.status == 1) {

      db.connection.query("SELECT * from " + data.dbTable, function (error, results, fields) {

        console.log('fields', fields[0].name)
        if (error) {
          console.log('err', error)
          reject(0)
        } else {
          resolve({ results: results, fields: fields })
        }
      });


    } else {

      reject(0)
    }
  });
}

// async function updateTableCell(db, output_table_info, updateCol, val, wherecol, wherecolVal) {

//   return new Promise(async (resolve, reject) => {

//     if (db && db.status == 1) {

//       var query = 'update ' + output_table_info.dbTable + ' set ' + updateCol + '=' + val + ' where ' + wherecol + '=' + wherecolVal

//       db.connection.query(query, function (error, results, fields) {
//         if (error) {
//           reject(0)
//         } else {
//           resolve(results)
//         }
//       });


//     } else {

//       reject(0)
//     }
//   });
// }

exports.rollbackPoll = async function (req, res) {
  var data = req.body;
  var output = [];
  for (var i = 0; i < data.length; i++) {
    var fn = data[i].function;
    var output_table_info = data[i].table;
    console.log(fn, output_table_info)
    var resultSetR = await getTableResultSet(output_table_info)
    resultSet = resultSetR.results
    console.log(resultSet, 'resultSet')
    output.push({ 'output_table': output_table_info.name, 'resultSet': resultSet })
  }
  res.status(200).send({
    status: 1,
    data: output
  });

}


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


// async function addbits(s) {

//   var total = 0,
//     s = s.match(/[+\-]*(\.\d+|\d+(\.\d+)?)/g) || [];

//   while (s.length) {
//     total += parseFloat(s.shift());
//   }
//   return total;
// }

// async function getValueFromResultSet(resultSet, row, col) {

//   return new Promise((resolve, reject) => {
//     row = parseInt(row)
//     col = parseInt(col)

//     if (resultSet.length >= row) {
//       var c = 0;
//       for (const v in resultSet[row]) {
//         if (c == col) {
//           resolve(resultSet[row][v] == null ? 0 : resultSet[row][v]);
//         }
//         c++;
//       }
//       if (c == 0) {
//         resolve(0)
//       }
//       console.log(resultSet.length, c, 'lennnnnnnnnnnn')

//     } else {
//       reject(0)
//     }

//   });

// }

// async function makeFunctionbuffer(fn, tableInfo) {

//   console.log('fn', fn)
//   return new Promise((resolve, reject) => {

//     var fn_buffer = [];
//     var skeleton = '';

//     var right_side = fn.split('=')[1];
//     var left_side = fn.split('=')[0];
//     var output_column = left_side.split('(')[1][0];

//     var pointers = right_side.split(']');

//     for (var p = 0; p < pointers.length; p++) {
//       if (pointers[p] != '') {
//         var vTable = pointers[p].split(':')[0];

//         if (p > 0) {
//           vTable = pointers[p].split(':')[0].slice(1);
//           skeleton = skeleton + '~' + pointers[p].split(':')[0].charAt(0);
//         }

//         var p_col = pointers[p].split(':[')[1].split(',')[0];
//         var p_row = pointers[p].split(',')[1];
//         console.log(pointers[p], 'sssss', p_col, p_row)
//         var cp = parseInt(output_column) + parseInt(p_col)
//         var rr = p_row
//         fn_buffer.push({
//           vTable: tableInfo,
//           cp: cp,
//           rr: rr,
//           output_column: output_column
//         });
//       }
//     }

//     resolve({ fn_buffer: fn_buffer, skeleton: skeleton + '~' })

//   });
// }