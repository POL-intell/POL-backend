
var express = require('express');
var router = express.Router();
var DBHelper = require('../helpers/db');
var async = require('async');
var MySQl = require('../helpers/mysql');
var PostgreSQL = require('../helpers/postgres');
var SqlLite = require('../helpers/sqlite');
const path = require('path')

/**execute pol accepts functions and calcualte the functions and return the result back for output table*/
const currentDirectory = __dirname;
const filePath = path.join(currentDirectory, './sqlite-sakila.db');

// exports.execuatePoll = async function (req, res) {
//   var functions = req.body.functions;
//   var execPoll = req.body.execPoll;
//   var tables_information = req.body.tables

//   var resultSetData = [];
//   var final_res = [];
//   let allResultSetData= [];
//   try {
//     for (var f = 0; f < functions.length; f++) {
//       var fn = functions[f];
//       //output columns table info 
//       var output_table_info = functions[f].table;

//       //output columns table info limit
//       var output_table_info_limit = output_table_info.limit ? output_table_info.limit : 20;
//       var resultSet = [];
//       var fields = [];
//       //exit resultSet
//       let function_type_If = fn.function.function.split(')=')[1].startsWith('~IF') ? true : false
//       var existResultSet = resultSetData.filter((t) => t.virtual_table == output_table_info.name)
//       if (existResultSet.length == 0){
//         resultSet = await DBHelper.getTableResultSet(output_table_info, output_table_info_limit);
//        // console.log(resultSet,'resultSet P P ')
//         resultSet = resultSet.results
//         var fieldsData = resultSet.fields;
//         fields = fieldsData
//         resultSetData.push({ 'virtual_table': output_table_info.name, 'resultSet': resultSet, 'fields': fieldsData })
//       } else {
//         resultSet = existResultSet[0].resultSet
//         fields = existResultSet[0].fields
//       }

//       let output_table_result_count = resultSet.length;
//       let getOutPutCol = output_table_info.resultSet.fields[fn.function.col].field
//       if(function_type_If){
//         let table_info_limit = 20;
//         await getAllResultSets(tables_information, table_info_limit, allResultSetData)
//         let {condition,truePart,falsePart} = fn.function.allOtherInfo
//         let {condition_left_side,conditional_operator,condition_right_side} = splitCondition(condition.data) 
//         let getEquationForLeftSideCondition = await processFunction(condition_left_side)
//         let getFinalEquationForLeftSideCondition = await processEquation(getEquationForLeftSideCondition, allResultSetData, fn.function.col)
//         let getEquationForRightSideCondition = await processFunction(condition_right_side)
//         let getFinalEquationForRightSideCondition = await processEquation(getEquationForRightSideCondition, allResultSetData, fn.function.col)
//         let getEquationForTruePart = await processFunction(truePart.data)
//         let getFinalEquationForTruePart = await processEquation(getEquationForTruePart, allResultSetData, fn.function.col)
//         let getEquationForFalsePart= falsePart !== null ? await processFunction(falsePart.data) : null
//         let getFinalEquationForFalsePart= getEquationForFalsePart !== null ? await processEquation(getEquationForFalsePart, allResultSetData, fn.function.col) : null

//         await Promise.all(resultSet.map(async (ele, index) => {
//             let result = null
//             if(execPoll == false){
//                 if((index+1) === fn.function.output_row){
//                   console.log(ele[getOutPutCol])
//                   // let value = await processFinalEquation(getFinalEquation, index)
//                   // console.log("value", value)
//                   let a = await processFinalEquation(getFinalEquationForLeftSideCondition)
//                   let b = conditional_operator
//                   let c = await processFinalEquation(getFinalEquationForRightSideCondition, index)
//                   switch (b) {
//                     case '<':
//                       result = a < c;
//                       break;
//                     case '>':
//                       result = a > c;
//                       break;
//                     case '<=':
//                       result = a <= c;
//                       break;
//                     case '>=':
//                       result = a >= c;
//                       break;
//                     default:
//                       console.log('Invalid operator');
//                       break;
//                   }
//                   if(result){
//                     let value  = await processFinalEquation(getFinalEquationForTruePart, index)
//                     ele[getOutPutCol] = value
//                   }else{
//                     if(getFinalEquationForFalsePart !==  null){
//                       let value  = await processFinalEquation(getFinalEquationForFalsePart, index)
//                       ele[getOutPutCol] = value
//                     }
//                   }
//                 }else{
//                   return ele
//                 }
//             }else{
//               let a = await processFinalEquation(getFinalEquationForLeftSideCondition,index)
//               console.log("a",a)
//               let c = await processFinalEquation(getFinalEquationForRightSideCondition, index)
//               let b = conditional_operator
//               console.log("c",c)
//               switch (b) {
//                 case '<':
//                   result = a < c;
//                   break;
//                 case '>':
//                   result = a > c;
//                   break;
//                 case '<=':
//                   result = a <= c;
//                   break;
//                 case '>=':
//                   result = a >= c;
//                   break;
//                 default:
//                   console.log('Invalid operator');
//                   break;
//               }
//               console.log("result",result)
//               if(result){
//                 let value  = await processFinalEquation(getFinalEquationForTruePart, index)
//                 ele[getOutPutCol] = value
//               }else{
//                 let value  = await processFinalEquation(getFinalEquationForFalsePart, index)
//                 ele[getOutPutCol] = value
//               }
//             }
//         }));
//         final_res.push({
//           status: 1,
//           data: resultSet,
//           output_table: output_table_info.name,
//           output_table_detail: output_table_info
//         })

//       }else{
//         console.log("HERRRR else")
//         var fbuffers = await DBHelper.makeFunctionbuffer(fn.function.function, output_table_info);
//         console.log("fbuffers",fbuffers)
//         var fbuffer = fbuffers.fn_buffer
//         var skeleton = fbuffers.skeleton
//         var edge_point = fbuffers.edge_point
  
//         //console.log(fbuffers,'fbuffers')
//         var neg_rows_indexes = fbuffer.filter((t) => t.rr < 0).map((t) => t.rr)
//         console.log("neg_rows_indexes",neg_rows_indexes)
//         var pos_rows_indexes = fbuffer.filter((t) => t.rr >= 0).map((t) => t.rr)
//         var REC = 0;
//         var N = 0;
//         //default edge point and last edge point
//         if ((edge_point == 0 || edge_point == 2) && neg_rows_indexes.length > 0) {
//           N = Math.min(...neg_rows_indexes)
//           if (N < 0) {
//             REC = REC - N;
//           }
//         }
  
//         var M = output_table_result_count - 1;
//         if (pos_rows_indexes.length > 0) {
//           //let max_positive_value = Math.max(...pos_rows_indexes)
//           // M = output_table_result_count - max_positive_value
//         }
//         var output_col = "";
//         var break_loop = false
  
//         if (execPoll == false) {
//           REC = functions[f].function.output_row - 1
//           M = REC;
//         }
//         console.log("REC",REC,M)
//         //console.log('output_table_result_count',M)
//         for (var i = REC; i <= M; i++) {
//           if (break_loop) {
//             break;
//           }
//           //iterate pointers
//           var pskeleton = skeleton
//           var pointer_values = [];
//           console.log("HERefbuffer",fbuffer)
//           for (var b = 0; b < fbuffer.length; b++) {
//             //console.log(fbuffer[b].value)
//             if (fbuffer[b].value) {
//               output_col = fbuffer[b].output_column;
//               continue;
//             }
//             var vTable = fbuffer[b].vTable;
//             var col_position = fbuffer[b].cp;
  
//             var row_position = i + parseInt(fbuffer[b].rr);
//             output_col = fbuffer[b].output_column;
//             console.log(output_col,'output_col,', fbuffer[b])
//             var virtual_table = fbuffer[b].virtual_table;
  
//             //console.log(REC,'REC')
  
//             if (parseInt(fbuffer[b].rr) + i > M && (edge_point == 0 || edge_point == 1 || edge_point == 2)) {
//               if (edge_point == 2) {
//                 pskeleton = pskeleton.replace('~', 0);
//               } else {
//                 pskeleton = pskeleton.replace('~', null);
//                 break_loop = true
//                 break;
//               }
//             }
//             var virtul_table_info = tables_information.filter((t) => t.name == virtual_table)[0]
           
//             var inner_result_set = [];
  
//             var existResultSet = resultSetData.filter((t) => t.virtual_table == virtual_table)
//            // console.log(existResultSet.length ,'ln',existResultSet)
//             if (existResultSet.length == 0 ) {
//               var inner_result_set_data = await DBHelper.getTableResultSet(virtul_table_info, output_table_info_limit);
//              // console.log(inner_result_set_data,'new upr')
//               inner_result_set = inner_result_set_data.results
//               var fieldsData = inner_result_set_data.fields
//               resultSetData.push({ 'virtual_table': virtual_table, 'resultSet': inner_result_set, 'fields': fieldsData })
//             } else {
//              // console.log('exist')
//               inner_result_set = existResultSet[0].resultSet
//             }
  
//             //console.log('virtul_table_info u u u u','pp pp')
  
//             try {
//               //   console.log(col_position,row_position,inner_result_set)
//               var col_row_value = await DBHelper.getValueFromResultSet(inner_result_set, row_position, col_position, edge_point);
//               // console.log('col_row_value', col_row_value)
//               pointer_values.push(col_row_value)
//               pskeleton = pskeleton.replace('~', col_row_value);
  
//             } catch (e) {
  
//               if (edge_point == 0) {
//                 pskeleton = pskeleton.replace('~', null);
//               } else {
//                 pskeleton = pskeleton.replace('~', 0);
//               }
//               // console.log('err')
//             }
  
//            //console.log('enddddddd',pskeleton)
//           }
  
//           console.log(pskeleton,'at end pskeleton')
  
//           var result = await DBHelper.addbits(pskeleton);
//           console.log(result,output_col,'at end output_col')
//           output_col = parseInt(output_col)
  
  
//           if (resultSet.length >= i) {
//             var c = 0;
//             for (const v in resultSet[i]) {
//               if (c == output_col) {
//                 resultSet[i][v] = result
//               }
//               c++;
//             }
//           }
//         }
  
//         final_res.push({
//           status: 1,
//           data: resultSet,
//           output_table: output_table_info.name,
//           output_table_detail: output_table_info
//         })
  
//       } 
//     }
//     res.status(200).send({
//       status: 1,
//       data: final_res
//     });
//   } catch (e) {
//     console.log("Error inside execuatePOLL",e)
//     res.status(200).send({
//       status: 1,
//       data: final_res
//     });
//   }
// }

exports.execuatePoll = async function (req, res) {
  const {functions, execPoll, tables} = req.body;
  const final_res = [];
  try {
    let table_info_limit = 20;
    const resultSetData =  await getAllResultSets(tables, table_info_limit)

    for (const fn of functions) {
      const output_table_info = fn.table;
      let outputTableData = resultSetData.find((ele)=> ele.table_name === output_table_info?.name)
      const resultSet = outputTableData.resultSet
      const fields = outputTableData.fields;
      let output_table_result_count = resultSet.length;
      let getOutPutCol = fields[fn.function.col].field
      let function_type_If = fn.function.function.split(')=')[1].startsWith('~IF') ? true : false    
      if(function_type_If){
        const edge_point = fn.function.function.split('=')[0].split('(')[1].split(',')[1].split(')')[0];
        console.log("edge_point",edge_point)
        let {condition,truePart,falsePart} = fn.function.allOtherInfo
        let {condition_left_side,conditional_operator,condition_right_side} = splitCondition(condition.data) 
        let getEquationForLeftSideCondition = await processFunction(condition_left_side)
        let getFinalEquationForLeftSideCondition = await processEquation(getEquationForLeftSideCondition, resultSetData, fn.function.col)
        let getEquationForRightSideCondition = await processFunction(condition_right_side)
        let getFinalEquationForRightSideCondition = await processEquation(getEquationForRightSideCondition, resultSetData, fn.function.col)
        let getEquationForTruePart = await processFunction(truePart.data)
        let getFinalEquationForTruePart = await processEquation(getEquationForTruePart, resultSetData, fn.function.col)
        let getEquationForFalsePart= falsePart !== null ? await processFunction(falsePart.data) : null
        let getFinalEquationForFalsePart= getEquationForFalsePart !== null ? await processEquation(getEquationForFalsePart, resultSetData, fn.function.col) : null

        await Promise.all(resultSet.map(async (ele, index) => {
            if(execPoll == false){
                if((index+1) === fn.function.output_row){
                  ele[getOutPutCol] = await getValueForOutputCol(getFinalEquationForLeftSideCondition,getFinalEquationForRightSideCondition,getFinalEquationForTruePart,getFinalEquationForFalsePart, index,conditional_operator,edge_point) 
                }else{
                  return ele
                }
            }else{
              ele[getOutPutCol] = await getValueForOutputCol(getFinalEquationForLeftSideCondition,getFinalEquationForRightSideCondition,getFinalEquationForTruePart,getFinalEquationForFalsePart, index,conditional_operator,edge_point) 
            }
        }));
        final_res.push({
          status: 1,
          data: resultSet,
          output_table: output_table_info.name,
          output_table_detail: output_table_info
        })

      }else{
        var fbuffers = await DBHelper.makeFunctionbuffer(fn.function.function, output_table_info);
        var fbuffer = fbuffers.fn_buffer
        var skeleton = fbuffers.skeleton
        var edge_point = fbuffers.edge_point
        console.log("edge_point",edge_point)
        var neg_rows_indexes = fbuffer.filter((t) => t.rr < 0).map((t) => t.rr)
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
        var output_col = "";
        var break_loop = false
  
        if (execPoll == false) {
          REC = fn.function.output_row - 1
          M = REC;
        }
        console.log("REC",REC)
        for (var i = REC; i <= M; i++) {
          if (break_loop) {
            break;
          }
          //iterate pointers
          var pskeleton = skeleton
          var pointer_values = [];
          for (var b = 0; b < fbuffer.length; b++) {
            if (fbuffer[b].value) {
              output_col = fbuffer[b].output_column;
              continue;
            }
            var col_position = fbuffer[b].cp;
            var row_position = i + parseInt(fbuffer[b].rr);
            output_col = fbuffer[b].output_column;
            var virtual_table = fbuffer[b].virtual_table;
    
            if (parseInt(fbuffer[b].rr) + i > M && (edge_point == 0 || edge_point == 1 || edge_point == 2)) {
              if (edge_point == 2) {
                pskeleton = pskeleton.replace('~', 0);
              } else {
                pskeleton = pskeleton.replace('~', null);
                break_loop = true
                break;
              }
            }           
            var inner_result_set = resultSetData.find((ele)=> ele.table_name === virtual_table).resultSet;
            try {
              var col_row_value = await DBHelper.getValueFromResultSet(inner_result_set, row_position, col_position, edge_point);
              pointer_values.push(col_row_value)
              pskeleton = pskeleton.replace('~', col_row_value);
            } catch (e) {
              if (edge_point == 0) {
                pskeleton = pskeleton.replace('~', null);
              } else {
                pskeleton = pskeleton.replace('~', 0);
              }
            }
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
    }
    res.status(200).send({
      status: 1,
      data: final_res
    });
  } catch (e) {
    console.log("Error inside execuatePOLL",e)
    res.status(200).send({
      status: 1,
      data: final_res
    });
  }
}

async function getValueForOutputCol(getFinalEquationForLeftSideCondition,getFinalEquationForRightSideCondition,getFinalEquationForTruePart,getFinalEquationForFalsePart, index, conditional_operator, edge_point){
  let value;
  let a = await processFinalEquation(getFinalEquationForLeftSideCondition, index, edge_point)
  let c = await processFinalEquation(getFinalEquationForRightSideCondition, index, edge_point)
  let b = conditional_operator
  switch (b) {
    case '<':
      result = a < c;
      break;
    case '>':
      result = a > c;
      break;
    case '<=':
      result = a <= c;
      break;
    case '>=':
      result = a >= c;
      break;
    default:
      console.log('Invalid operator');
      break;
  }
  if(result){
      value  = await processFinalEquation(getFinalEquationForTruePart, index, edge_point)
  }else{
    if(getFinalEquationForFalsePart !==  null){
      value  = await processFinalEquation(getFinalEquationForFalsePart, index, edge_point)
    }
  }
  return value
}


function splitCondition(inputString) {
  // Define the regular expression pattern
  try{
    var pattern = /(<=|>=|==|<|>)/;
    
    // Use the pattern to split the string
    var splitResult = inputString.split(pattern);
    
    // Remove empty strings from the result
    splitResult = splitResult.filter(item => item.trim() !== '');
  }catch(err){
    console.log("Error insdie splitCondition",err)
  }
  return {condition_left_side :splitResult[0],conditional_operator:splitResult[1],condition_right_side:splitResult[2]};
}

/**
 * This function will take the final equation and process it for each element of output column and get value value for output column.
 * @param {array of objects and strings} getFinalEquation 
 * @param {output column index} index 
*/

async function processFinalEquation(inputArray,index,edge_point) {
  let result = null;
  let currentOperator = null;
  for (let i = 0; i < inputArray.length; i++) {
      const element = inputArray[i];
      if (typeof element === 'object' && element !== null) {
          // Process object type element with a different formula
          // For example, assuming there's a function getValueFromObject to get a value from the object
          console.log("edge_point",edge_point)
          let valueFromObject = (edge_point == 0 || edge_point == 2) ? null : 0
          if(element.all_col_values[index+ element.rr] === undefined && valueFromObject == null) break;
          if(index + element.rr >= 0){
            valueFromObject = element.all_col_values[index+ element.rr] ? element.all_col_values[index+ element.rr] : 0
          }
          if(currentOperator == null){
            result = valueFromObject
          }else{
            if (currentOperator === '+') {
              result += valueFromObject;
            } else if (currentOperator === '-') {
                result -= valueFromObject;
            } else if (currentOperator === '*') {
                result *= valueFromObject;
            } else if (currentOperator === '/') {
                result /= valueFromObject;
            }
          }
      } else if (typeof element === 'string'  && '+-*/'.includes(element)) {
          // Process operator
          currentOperator = element;
      } else if (!isNaN(parseFloat(element))) {
          // Process numeric value
          const numericValue = parseFloat(element);

          if (currentOperator === '+') {
              result += numericValue;
          } else if (currentOperator === '-') {
              result -= numericValue;
          } else if (currentOperator === '*') {
              result *= numericValue;
          } else if (currentOperator === '/') {
              result /= numericValue;
          } else {
              // If no operator is set, initialize result with the numeric value
              result = numericValue;
          }
      }

  }
  return result;
}

/**
 * This function executes to process the equation of function. 
 * @param {array of string} arr => ["Table0:[2,3]","+","5",..] 
 * @param {array of objects that contains all resultSets of tables used in formulae} allResultSetData =>[{resultSet:[{},{}], fields:[{},{}], table_name},...] 
 * @param {string output column form the output table} outputcol 
 * @returns {return array of elements that contains objects and string the objects map to a pointer sused in formulae} =>  [{all_col_values:[],rr(Relative row ):"", cp(column position):""}]
 */
async function processEquation(arr,allResultSetData,outputcol) {
  let data = arr.map((ele,index)=>{
      let object = {}
      if(/^[a-zA-Z0-9_]+:\[.*\]$/.test(ele)){
        let getTableName = ele.split(':')[0]
        let getReusltSet = allResultSetData.find((ele)=> ele.table_name === getTableName)
        let getRr = parseInt(ele.split(':')[1].replace('[',"").replace(']',"").split(',')[1])
        //get column position
        let getCp = parseInt(outputcol) + parseInt(ele.split(':')[1].replace('[',"").replace(']',"").split(',')[0])
        let getColName = getReusltSet.fields[getCp].field
        // console.log("getColName",getColName)
        object.all_col_values = getReusltSet.resultSet.map((item) => item[getColName])
        object.rr = getRr
        object.cp = getCp
        return object
      }else{
        return ele
      }
  })
  return data
}

async function processFunction(inputString) {
  let right_side = inputString.split("");
  let pointers_arr = [];
  let last_operator = '';
  let string = '';

  for (let p = 0; p < right_side.length; p++) {
      let txt = right_side[p];

      if ((txt == '+' || txt == '-' || txt == '/' || txt == '*') && (right_side[p - 1] == ']' || !isNaN(string) || /^[a-zA-Z0-9_]+:\[.*\]$/.test(string))) {
          if (string !== '') {
              pointers_arr.push(string);
          }
          pointers_arr.push(txt);
          last_operator = txt;
          string = '';
      } else {
          string = string + txt;
      }
  }

  // Handle the last part of the string
  if (string !== '') {
      if (/^[a-zA-Z0-9_]+:\[.*\]$/.test(string) || !isNaN(string)) {
          pointers_arr.push(string);
      }
  }

  return pointers_arr;
}

async function getAllResultSets(tables_information,table_info_limit){
  let allResultSetData =[]
  try{
    for(let table of tables_information){
      let table_info_obj = {}
      let is_Table_Info_Exist =  allResultSetData.filter((ele)=>{ele.table_name === table.name})
      if(is_Table_Info_Exist.length > 0){
        continue;
      }else{
        let tableInfo = await DBHelper.getTableResultSet(table, table_info_limit);
        table_info_obj.resultSet = tableInfo?.results
        table_info_obj.fields = table.resultSet.fields
        table_info_obj.table_name = table.name
        allResultSetData.push(table_info_obj)
      }
    }
  }catch(err){
    console.log("Error inside getAllResultSets")
  }
  return allResultSetData
}

exports.checkUserPriviliges = async function (req,res) {
  try {
    let havePermission = false
    if (output_table_info.dbDetails.type == 'PostgreSQL') {
      havePermission = await PostgreSQL.checkPrivilige(config);
      
    }else if (output_table_info.dbDetails.type == 'MySQL') {
      console.log("in mysql")
      havePermission = await MySQl.checkPrivilige(config);
      
    }else if (output_table_info.dbDetails.type == 'SQLite') {
      console.log("in sqlite")
      // output_table_info.dbDetails.dbPath = filePath
      havePermission = await SqlLite.getUniqueCol(config);
    } 
    res.status(200).send({
      status: havePermission ? 1 :0,
    });
  }catch (e) {
    console.log(e,'eee')
    required_col.push(output_table_info.dbTable)
  }
}

exports.checkUNiqueColumns = async function (req, res) {
  var functions = req.body.functions;
  var tables_information = req.body.tables

  var resultSetData = [];
  var final_res = [];
  var required_col=[];


    for (var f = 0; f < functions.length; f++) {
      var fn = functions[f];
      var output_table_info = functions[f].table;
      console.log("output_table_info",output_table_info)
    //  var output_table_db_connection = await DBHelper.createConnection(output_table_info.dbDetails);
    try {
      if (output_table_info.dbDetails.type == 'PostgreSQL') {
        var uniqueCall = await PostgreSQL.getUniqueCol(output_table_info.dbDetails, output_table_info.dbTable);
        
      }else if (output_table_info.dbDetails.type == 'MySQL') {
        console.log("in mysql")
        var uniqueCall = await MySQl.getUniqueCol(output_table_info.dbDetails, output_table_info.dbTable);
        
      } else if (output_table_info.dbDetails.type == 'SQLite') {
        console.log("in sqlite")
        // output_table_info.dbDetails.dbPath = filePath
        var uniqueCall = await SqlLite.getUniqueCol(output_table_info.dbDetails, output_table_info.dbTable);
        
      } 

    }catch (e) {
      console.log(e,'eee')
      required_col.push(output_table_info.dbTable)
    }
  }
    console.log("required_col",required_col)

    if(required_col.length>0){
      required_col = required_col.filter(function (value, index, array) { 
        return array.indexOf(value) === index;
      });
      console.log("output_table_info.dbDetails.type",output_table_info.dbDetails.type)
      if(output_table_info.dbDetails.type == 'SQLite'){
        res.status(200).send({
          status: 0,
          data: [],
          type:"SQLite",
          message: "POL requires a unique column type to perform a commit operation."
        });
      }else{
        res.status(200).send({
         status: 0,
         data: [],
         type:"typical",
         message: "POL requires a unique column type to perform a commit operation."
       });
      }
      return;

    }else{
      res.status(200).send({
        status: 1
      });
      return;

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
      //console.log(output_table_info, 'output_table_info')

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
          // return;
          whereCol = uniqueCall.cols;
          //console.log(whereCol, 'whereColwhereColwhereCol')
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
            // return
            if (c == output_col) {
              resultSet[i][v] = result
              //update table columns cells
              batchOperationCounter++
              try {
                //console.log(i, M)
                await batchOperationData.push({ 'where': wherecolVal, 'output_field': v, 'value': result, 'db_connection': output_table_db_connection, 'output_table_info': output_table_info });
                if (batchOperationCounter == 50000 || i == M) {
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
       // console.log('results', results)
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
    console.log("data.length",data.length)
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
      
      if(output_table_info.dbDetails.type=='PostgreSQL'){
        db.connection.query(query, function (error, results, fields) {
          cb();
          if (error) {
            console.log(error)
          } else {
           // console.log(results)
          }
        });
      }else if(output_table_info.dbDetails.type=='MySQL'){
        db.connection.query(query, function (error, results, fields) {
          cb();
          if (error) {
            console.log(error)
          } else {
            //console.log(results)
          }
        });
      }
      else if(output_table_info.dbDetails.type=='SQLite'){
        db.connection.serialize(function () {
        db.connection.all(query, function (error, results, fields) {
          cb();
          if (error) {
            console.log(error)
          } else {
            //console.log(results)
          }
        });
      })
        // db.connection.serialize(function () {
        //   db.connection.run('BEGIN TRANSACTION', function (beginError) {
        //     if (beginError) {
        //       console.log("beginError",beginError);
        //     } else {
        //       db.connection.all(query, function (error, results, fields) {
        //         if (error) {
        //           db.connection.run('ROLLBACK', function (rollbackError) {
        //             if (rollbackError) {
        //               console.log("rollbackError",rollbackError);
        //             }
        //           });
        //         } else {
        //           db.connection.run('COMMIT', function (commitError) {
        //             if (commitError) {
        //               console.log("commitError",commitError);
        //               // Handle the commit error
        //             }
        //           });
        //         }
        
        //         // You can call the callback function (cb) here if needed
        //         cb();
        //       });
        //     }
        //   });
        // });
        
        
      }
    } else {
      console.log('errrrrr hereeee')
    }
  };
}