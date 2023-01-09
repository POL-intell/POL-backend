
var express = require('express');
var router = express.Router();
//var Database = require('../models/Database');
var DBHelper = require('../helpers/db');

exports.execuatePoll = async function (req, res) {

    var functions = req.body.functions;
    var tables_information = req.body.tables

    var resultSetData=[];
    var final_res=[];
    
    for (var f = 0; f < functions.length; f++) {
      var fn = functions[f];     
      var output_table_info = functions[f].table;
      //let output_table_result_count = output_table_info.resultSetCount;
      var resultSet = [];
      var fields =[];
      var existResultSet = resultSetData.filter((t)=>t.virtual_table == output_table_info.name)
      if (existResultSet.length == 0) {
        console.log('herrreeee',output_table_info.name)
        var info = await DBHelper.getTableResultSet(output_table_info);
        resultSet = info.results
        var fieldsData = info.fields
        //var fieldsData = await DBHelper.getTableResultSet(output_table_info).fields;
        resultSetData.push({'virtual_table':output_table_info.name,'resultSet':resultSet,'fields':fieldsData})
      }else{
        resultSet = existResultSet[0].resultSet
        fields=  existResultSet[0].fields
      }

      let output_table_result_count = resultSet.length;
      
      
      var fbuffers = await DBHelper.makeFunctionbuffer(fn.function.function, output_table_info);
      var fbuffer = fbuffers.fn_buffer
      var skeleton = fbuffers.skeleton
  
      var neg_rows_indexes = fbuffer.filter((t) => t.rr < 0).map((t) => t.rr)
      var pos_rows_indexes = fbuffer.filter((t) => t.rr >= 0).map((t) => t.rr)
      var REC = 0;
      var N = 0;
      //console.log('neg_rows_indexes', neg_rows_indexes, fbuffers)
      if (neg_rows_indexes.length > 0) {
        N = Math.min(...neg_rows_indexes)
        if (N < 0) {
          REC = 1 - N;
        }
      }
  
      var M = output_table_result_count - 1;
      if (pos_rows_indexes.length > 0) {
        //let max_positive_value = Math.max(...pos_rows_indexes)
        // M = output_table_result_count - max_positive_value
  
      }
      var output_col = "";
  
      for (var i = REC; i <= M; i++) {
        //iterate pointers
        var pskeleton = skeleton
        var pointer_values = [];
        for (var b = 0; b < fbuffer.length; b++) {
          var vTable = fbuffer[b].vTable;
          var col_position = fbuffer[b].cp;
          var row_position = i + parseInt(fbuffer[b].rr);
          output_col = fbuffer[b].output_column;
          var virtual_table = fbuffer[b].virtual_table;
  
          if (row_position < 0) {
            row_position = 1
          }

          var virtul_table_info = tables_information.filter((t)=>t.name==virtual_table)[0]

          var inner_result_set=[];

          var existResultSet = resultSetData.filter((t)=>t.virtual_table == virtual_table)
          if (existResultSet.length == 0) {
            console.log('create new connnnnnnn')
            inner_result_set = await DBHelper.getTableResultSet(virtul_table_info);
            inner_result_set = inner_result_set.results
            var fieldsData = await DBHelper.getTableResultSet(virtul_table_info).fields;
            resultSetData.push({'virtual_table':virtul_table_info.name,'resultSet':inner_result_set,'fields':fieldsData})
          }else{
            inner_result_set = existResultSet[0].resultSet
            //fields=  existResultSet[0].fields
           // console.log(inner_result_set,'inner_result_set')
          }
  
  
          try {
            var col_row_value = await DBHelper.getValueFromResultSet(inner_result_set, row_position, col_position);
  
            pointer_values.push(col_row_value)
            pskeleton = pskeleton.replace('~', col_row_value);
  
          } catch (e) {
            pskeleton = pskeleton.replace('~', 0);
            console.log('err')
          }
        }
  
  
        var result = await DBHelper.addbits(pskeleton);
        console.log(result,'result')
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
        output_table:output_table_info.name
      })
  
    }

    console.log(final_res,'final_res')
  
    res.status(200).send({
      status: 1,
      data: final_res
    });
  
  }