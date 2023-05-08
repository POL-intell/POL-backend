
var express = require('express');
var router = express.Router();
var DBHelper = require('../helpers/db');
var async = require('async');


/**execute pol accepts functions and calcualte the functions and return the result back for output table*/
exports.execuatePoll = async function (req, res) {

  var functions = req.body.functions;
  var execPoll = req.body.execPoll;
  var tables_information = req.body.tables

  var resultSetData = [];
  var final_res = [];

  try {
    for (var f = 0; f < functions.length; f++) {
      var fn = functions[f];
      var output_table_info = functions[f].table;
      var output_table_info_limit = output_table_info.limit ? output_table_info.limit : 20;
      var resultSet = [];
      var fields = [];
      var existResultSet = resultSetData.filter((t) => t.virtual_table == output_table_info.name)
      if (existResultSet.length == 0) {
        resultSet = await DBHelper.getTableResultSet(output_table_info, output_table_info_limit);
       // console.log(resultSet,'resultSet P P ')
        resultSet = resultSet.results
        var fieldsData = await DBHelper.getTableResultSet(output_table_info, output_table_info_limit).fields;
        resultSetData.push({ 'virtual_table': output_table_info.name, 'resultSet': resultSet, 'fields': fieldsData })
      } else {
        resultSet = existResultSet[0].resultSet
        fields = existResultSet[0].fields
      }

      let output_table_result_count = resultSet.length;


      var fbuffers = await DBHelper.makeFunctionbuffer(fn.function.function, output_table_info);
      var fbuffer = fbuffers.fn_buffer
      var skeleton = fbuffers.skeleton
      var edge_point = fbuffers.edge_point

      //console.log(fbuffers,'fbuffers')
      var neg_rows_indexes = fbuffer.filter((t) => t.rr < 0).map((t) => t.rr)
      var pos_rows_indexes = fbuffer.filter((t) => t.rr >= 0).map((t) => t.rr)
      var REC = 0;
      var N = 0;
      //default edge point and last edge point
      if ((edge_point == 0 || edge_point == 2) && neg_rows_indexes.length > 0) {
        N = Math.min(...neg_rows_indexes)
        if (N < 0) {
          REC = REC - N;
        }
      }



      var M = output_table_result_count - 1;
      if (pos_rows_indexes.length > 0) {
        //let max_positive_value = Math.max(...pos_rows_indexes)
        // M = output_table_result_count - max_positive_value
      }
      var output_col = "";
      var break_loop = false

      if (execPoll == false) {
        REC = functions[f].function.output_row - 1
        M = REC;
      }
      //console.log('output_table_result_count',M)
      for (var i = REC; i <= M; i++) {
        if (break_loop) {
          break;
        }
        //iterate pointers
        var pskeleton = skeleton
        var pointer_values = [];
        for (var b = 0; b < fbuffer.length; b++) {
          //console.log(fbuffer[b].value)
          if (fbuffer[b].value) {
            continue;
          }
          var vTable = fbuffer[b].vTable;
          var col_position = fbuffer[b].cp;

          var row_position = i + parseInt(fbuffer[b].rr);
          output_col = fbuffer[b].output_column;
          var virtual_table = fbuffer[b].virtual_table;

          //console.log(REC,'REC')

          if (parseInt(fbuffer[b].rr) + i > M && (edge_point == 0 || edge_point == 1 || edge_point == 2)) {


            if (edge_point == 2) {
              pskeleton = pskeleton.replace('~', 0);
            } else {
              pskeleton = pskeleton.replace('~', null);
              break_loop = true
              break;
            }
            //console.log(REC,'RECherreeeee')


          }

          
          var virtul_table_info = tables_information.filter((t) => t.name == virtual_table)[0]
         
          var inner_result_set = [];

          var existResultSet = resultSetData.filter((t) => t.virtual_table == virtual_table)
         // console.log(existResultSet.length ,'ln',existResultSet)
          if (existResultSet.length == 0 ) {
            var inner_result_set_data = await DBHelper.getTableResultSet(virtul_table_info, output_table_info_limit);
            console.log(inner_result_set_data,'new upr')
            inner_result_set = inner_result_set_data.results
            var fieldsData = inner_result_set_data.fields
            resultSetData.push({ 'virtual_table': virtual_table, 'resultSet': inner_result_set, 'fields': fieldsData })
          } else {
            inner_result_set = existResultSet[0].resultSet
          }

          console.log('virtul_table_info u u u u',inner_result_set,'pp pp')

          try {
            //   console.log(col_position,row_position,inner_result_set)
            var col_row_value = await DBHelper.getValueFromResultSet(inner_result_set, row_position, col_position, edge_point);
            // console.log('col_row_value', col_row_value)
            pointer_values.push(col_row_value)
            pskeleton = pskeleton.replace('~', col_row_value);

          } catch (e) {

            if (edge_point == 0) {
              pskeleton = pskeleton.replace('~', null);
            } else {
              pskeleton = pskeleton.replace('~', 0);
            }
            // console.log('err')
          }

         console.log('enddddddd',pskeleton)
        }


        var result = await DBHelper.addbits(pskeleton);
        output_col = parseInt(output_col)


        if (resultSet.length >= i) {
          var c = 0;
          for (const v in resultSet[i]) {
            if (c == output_col) {
              resultSet[i][v] = result
            }
            c++;
          }
        }
      }

      final_res.push({
        status: 1,
        data: resultSet,
        output_table: output_table_info.name,
        output_table_detail: output_table_info
      })

    }
    res.status(200).send({
      status: 1,
      data: final_res
    });
  } catch (e) {
    res.status(200).send({
      status: 1,
      data: final_res
    });
  }
}

/**commit pol accepts functions and calcualte the functions and save the results into  table*/
exports.commitPoll = async function (req, res) {

  var functions = req.body.functions;
  var tables_information = req.body.tables

  var resultSetData = [];
  var final_res = [];


  try {
    for (var f = 0; f < functions.length; f++) {
      var fn = functions[f];
      var output_table_info = functions[f].table;
      var output_table_db_connection = await DBHelper.createConnection(output_table_info.dbDetails);
      console.log(output_table_info, 'output_table_info')

      var resultSet = [];
      var fields = [];
      var existResultSet = resultSetData.filter((t) => t.virtual_table == output_table_info.name)
      if (existResultSet.length == 0) {
        var resultSetD = await DBHelper.getTableResultSet(output_table_info);
        resultSet = resultSetD.results
        var fieldsData = resultSetD.fields;
        //await DBHelper.getTableResultSet(output_table_info,20).fields;

        var whereCol = "pol";
        try {
          var uniqueCall = await DBHelper.getUniqueCol(output_table_info.dbDetails, output_table_info.dbTable);
          whereCol = uniqueCall.cols;
          console.log(whereCol, 'whereColwhereColwhereCol')
        } catch (e) {
          res.status(200).send({
            status: 0,
            data: [],
            message: "Not found unique column"
          });
          return;
        }
        resultSetData.push({ 'virtual_table': output_table_info.name, 'resultSet': resultSet, 'fields': fieldsData })
      } else {
        resultSet = existResultSet[0].resultSet
        fields = existResultSet[0].fields
      }

      let output_table_result_count = resultSet.length;


      var fbuffers = await DBHelper.makeFunctionbuffer(fn.function.function, output_table_info);
      var fbuffer = fbuffers.fn_buffer
      var skeleton = fbuffers.skeleton
      var edge_point = fbuffers.edge_point

      //console.log(fbuffers,'fbuffers')
      var neg_rows_indexes = fbuffer.filter((t) => t.rr < 0).map((t) => t.rr)
      var pos_rows_indexes = fbuffer.filter((t) => t.rr >= 0).map((t) => t.rr)
      var REC = 0;
      var N = 0;
      //default edge point and last edge point
      if ((edge_point == 0 || edge_point == 2) && neg_rows_indexes.length > 0) {
        N = Math.min(...neg_rows_indexes)
        if (N < 0) {
          REC = REC - N;
        }
      }



      var M = output_table_result_count - 1;
      if (pos_rows_indexes.length > 0) {
        //let max_positive_value = Math.max(...pos_rows_indexes)
        // M = output_table_result_count - max_positive_value
      }
      var output_col = "";
      var break_loop = false

      var batchOperationCounter = 0;
      var batchOperationData = [];
      var batches = [];
      //console.log('output_table_result_count',M)
      for (var i = REC; i <= M; i++) {
        if (break_loop) {
          break;
        }
        //iterate pointers
        var pskeleton = skeleton
        var pointer_values = [];
        for (var b = 0; b < fbuffer.length; b++) {
          //console.log(fbuffer[b].value)
          if (fbuffer[b].value) {
            continue;
          }
          var vTable = fbuffer[b].vTable;
          var col_position = fbuffer[b].cp;

          var row_position = i + parseInt(fbuffer[b].rr);
          output_col = fbuffer[b].output_column;
          var virtual_table = fbuffer[b].virtual_table;

          //console.log(REC,'REC')

          if (parseInt(fbuffer[b].rr) + i > M && (edge_point == 0 || edge_point == 1 || edge_point == 2)) {


            if (edge_point == 2) {
              pskeleton = pskeleton.replace('~', 0);
            } else {
              pskeleton = pskeleton.replace('~', null);
              break_loop = true
              break;
            }
            //console.log(REC,'RECherreeeee')


          }


          var virtul_table_info = tables_information.filter((t) => t.name == virtual_table)[0]

          var inner_result_set = [];

          var existResultSet = resultSetData.filter((t) => t.virtual_table == virtual_table)
          if (existResultSet.length == 0) {
            var inner_result_set_data = await DBHelper.getTableResultSet(virtul_table_info, 20);
            inner_result_set = inner_result_set_data.results
            var fieldsDataa = inner_result_set_data.fields
            resultSetData.push({ 'virtual_table': virtual_table, 'resultSet': inner_result_set, 'fields': fieldsDataa })
          } else {
            inner_result_set = existResultSet[0].resultSet
          }


          try {
            //   console.log(col_position,row_position,inner_result_set)
            var col_row_value = await DBHelper.getValueFromResultSet(inner_result_set, row_position, col_position, edge_point);
            //  console.log('col_row_value', col_row_value)
            pointer_values.push(col_row_value)
            pskeleton = pskeleton.replace('~', col_row_value);

          } catch (e) {

            if (edge_point == 0) {
              pskeleton = pskeleton.replace('~', null);
            } else {
              pskeleton = pskeleton.replace('~', 0);
            }
            // console.log('err')
          }

          //console.log('enddddddd',pskeleton)
        }


        var result = await DBHelper.addbits(pskeleton);
        output_col = parseInt(output_col)


        if (resultSet.length >= i) {
          var c = 0;
          var wherecolVal = [];
          for (const v in resultSet[i]) {
            if (c == 0) {
              //var n = fieldsData[0].name;
              for (var w = 0; w < whereCol.length; w++) {
                var n = whereCol[w];
                //var n = whereCol;
                wherecolVal.push({ col: whereCol[w], val: "'" + resultSet[i][n] + "'" })
              }
            }

            if (c == output_col) {
              resultSet[i][v] = result
              //update table columns cells
              batchOperationCounter++
              try {
                console.log(i, M)
                await batchOperationData.push({ 'where': wherecolVal, 'output_field': v, 'value': result, 'db_connection': output_table_db_connection, 'output_table_info': output_table_info });
                if (batchOperationCounter == 50000 || i == M) {


                  console.log('created batch')
                  batchOperationCounter = 0
                  batches.push(batch(1000, batchOperationData))

                  batchOperationData = [];
                }


              } catch (e) {
                console.log('eee', e)
              }

            }
            c++;
          }
        }
      }


      async.series(batches, function (err, results) {
        if (err) console.log("Done! Error: ", err);
        console.log(new Date());
        console.log('results', results)
      });

      final_res.push({
        status: 1,
        data: resultSet,
        output_table: output_table_info.name
      })

    }
    res.status(200).send({
      status: 1,
      data: final_res
    });
  } catch (e) {
    console.log(e, 'eeee')
    res.status(200).send({
      status: 1,
      data: final_res
    });
  }
}


/**Batch operations to update data*/
function batch(parallelLimit, data) {

  return function (cb) {
    var toDo = [];

    //pushing each process onto the toDo list
    for (var i = 0; i < data.length; i++) {
      toDo.push(process(data[i]));
    }

    //run each process from the toDo list in series
    async.parallelLimit(toDo, parallelLimit, function (err, result) {
      if (err) {
        console.log("Error2", err);
        cb(err);
      } else {
        console.log('else err', result, err)
        cb()
      }
    });

  }
}


/**process the batched data*/
function process(data) {
  console.log('processsssssssssssssssssssssssssssssssssssssssssssssssss',data)

  var db = data.db_connection;
  var updateCol = data.output_field;
  var val = data.value;

  return function (cb) {

    if (db && db.status == 1) {

      var val = data.value;
      var output_table_info = data.output_table_info;


      var where = ' where ';
      for (w = 0; w < data.where.length; w++) {
        var wdata = data.where;
        if (w > 0) {
          where = where + ' and ';
        }
        where = where + ' ' + wdata[w].col + '= ' + wdata[w].val + ' ';
      }

      var query = 'update ' + output_table_info.dbTable + '  set ' + updateCol + '=' + val + where
      console.log(query, 'query',output_table_info.type)
      if(output_table_info.dbDetails.type=='PostgreSQL'){
        db.connection.query(query, function (error, results, fields) {
          cb();
          if (error) {
            console.log(error)
          } else {
            console.log(results)
          }
        });
      }else if(output_table_info.dbDetails.type=='MySQL'){
        db.connection.query(query, function (error, results, fields) {
          cb();
          if (error) {
            console.log(error)
          } else {
            console.log(results)
          }
        });
      }
    } else {
      console.log('errrrrr hereeee')
    }
  };
}