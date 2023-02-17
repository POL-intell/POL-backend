var express = require('express');
var router = express.Router();
//var Database = require('../models/Database');
var DBHelper = require('../helpers/db');



/**Add database and create connection to check id DB is connectting or not*/
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


/**Get the table slist from database details*/
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


/**get the table slist from database details*/
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

/**get the meta data of table*/
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

/**get the data from a table */
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

/**get the sql result of a table*/
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



async function getTableResultSet(data) {
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


/**rollback function get the output table and get the results from db and send them back*/
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


