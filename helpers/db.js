var mysql = require('mysql2');

exports.createConnection = async function (config) {

	config = {
		host: config.host,
		user: config.username,
		password: config.password,
		database: config.database,
	}

	//console.log('configsss', config)

	return new Promise((resolve, reject) => {

		var connection = mysql.createConnection(config);
		connection.connect(function (err, result) {
			console.log('errr', err)

			if (err) {
				reject({
					message: err,
					status: 0
				});
			} else {
				resolve({
					connection: connection,
					status: 1
				});
			}
		});
	}).catch(error => {

		//	console.log('errr', error)
		/*return {
		message: error,
		status:0         
  };*/
	});
}

async function makeConnection(config) {

	return new Promise((resolve, reject) => {

		var connection = mysql.createConnection(config);
		connection.connect(function (err, result) {
		//	console.log('errr connection', err)

			if (err) {
				reject({
					message: err,
					status: 0
				});
			} else {
				resolve({
					connection: connection,
					status: 1
				});
			}
		});
	}).catch(error => {

		console.log('errr cacth connection', error)
		/*return {
		message: error,
		status:0         
  };*/
	});
}

exports.getTableColumns = async function (config) {

	var result = await makeConnection(config);
	//console.log('connection', result, config)
	return new Promise((resolve, reject) => {
		result.connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='" + config.database + "' AND TABLE_NAME='" + config.table + "'", function (error, result, fields) {
			//console.log(error)
			if (error) {
				reject({
					message: error,
					status: 0
				});
			} else {
				//console.log('resultresult', result)
				result = result.map(c => c.COLUMN_NAME)
				resolve({
					columns: result,
					status: 1
				});
			}
		});
	});
}

exports.addPolColumn= async function(data,table){
	return new Promise(async (resolve, reject) => {

		//console.log('data.dbDetails')
		var db = await makeConnection({
			host: data.host,
			user: data.username,
			password: data.password,
			database: data.database,


		});


		if (db && db.status == 1) {
      
      db.connection.query("ALTER TABLE "+table+" ADD COLUMN pol int AUTO_INCREMENT PRIMARY KEY", function (error, results, fields) {

				//console.log('fields', fields[0].name)
				if (error) {
					console.log('err', error)
					reject(0)
				} else {
					resolve({ results: results, fields: fields })
				}
			});

    }else{
		reject(0)
    }
  });
}

exports.getTableResultSet = async function (data,no_of_rows=null) {
	//var data = req.body
	return new Promise(async (resolve, reject) => {

		//console.log('data.dbDetails')
		var db = await makeConnection({
			host: data.dbDetails.host,
			user: data.dbDetails.username,
			password: data.dbDetails.password,
			database: data.dbDetails.database,


		});


		if (db && db.status == 1) {

			var limit="";
			if(no_of_rows){
				limit = " LIMIT "+ no_of_rows
			}
			var from =0;
			var sql = "SELECT * from " + data.dbTable + limit;
			if(data.start_index){
			
				sql = "SELECT * from `" + data.dbTable + "` LIMIT " +data.start_index+" , "+ no_of_rows+" "
			}
			console.log("SELECT * from " + data.dbTable + limit)

			db.connection.query(sql, function (error, results, fields) {

				//console.log('fields', fields[0].name)
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
exports.getUniqueCol = async function (data,table) {
	//var data = req.body
	return new Promise(async (resolve, reject) => {

		//console.log('data.dbDetails')
		var db = await makeConnection({
			host: data.host,
			user: data.username,
			password: data.password,
			database: data.database,


		});


		if (db && db.status == 1) {

			

			db.connection.query("SELECT K.COLUMN_NAME,T.CONSTRAINT_TYPE FROM  INFORMATION_SCHEMA.TABLE_CONSTRAINTS T JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE K ON K.CONSTRAINT_NAME=T.CONSTRAINT_NAME  WHERE K.TABLE_NAME='"+table+"' group by K.COLUMN_NAME,T.CONSTRAINT_TYPE"
			, function (error, results) {

				console.log('fields', error,results)

				if(results.length >0 ){
					//var ifPrimary = ;results.filter((e)=>e.CONSTRAINT_TYPE== 'PRIMARY KEY')
					//var ifUNique = results.filter((e)=>e.CONSTRAINT_TYPE== 'UNIQUE');
					// if(ifPrimary.length>0){
					// 	resolve({ column_name: ifPrimary[0].COLUMN_NAME, fields: ifPrimary[0].CONSTRAINT_TYPE })
					// }else if(ifUNique.length>0){
					// 	resolve({ column_name: ifUNique[0].COLUMN_NAME, fields: ifUNique[0].CONSTRAINT_TYPE })
					// }else{
					// 	reject(0)
					// }
					var cols = results.map((e)=>e.COLUMN_NAME)
console.log(cols,'cols')
					resolve({ cols: cols })
				}else{
					reject(0)
				}
				// if (error) {
				// 	console.log('err', error)
				// 	reject(0)
				// } else {
				// 	resolve({ results: results, fields: fields })
				// }
			});


		} else {

			reject(0)
		}
	});
}
exports.getValueFromResultSet = async function (resultSet, row, col, edge_point = 0) {

	return new Promise((resolve, reject) => {
		row = parseInt(row)
		col = parseInt(col)

		if (resultSet.length >= row) {
			var c = 0;
			for (const v in resultSet[row]) {
				if (c == col) {
					// if (edge_point == 0) {
					// 	resolve(resultSet[row][v] == null ? null : resultSet[row][v]);
					// } else {
					// 	resolve(resultSet[row][v] == null ? 0 : resultSet[row][v]);
					// }
					resolve(resultSet[row][v] == null ? 0 : resultSet[row][v]);
				}
				c++;
			}
			if (c == 0) {
				if (edge_point == 0) {
					resolve(null)
				} else {
					resolve(0)
				}
			}

		} else {
			reject(0)
		}

	});

}

exports.makeFunctionbuffer = async function (fn, tableInfo) {

//	console.log('fn', fn)
	return new Promise((resolve, reject) => {

		var fn_buffer = [];
		var skeleton = '';

		var right_side = fn.split('=')[1];
		right_side = right_side.split(" ").join("")
		var left_side = fn.split('=')[0];

		var pointers_arr=[];
		var string="";
		var last_operator="";
		//console.log('rrrrrr',right_side)
		for(p=0;p<right_side.length;p++){
			var txt = right_side[p];
			
			//console.log(right_side[p],'rrrrr ppp',right_side[p-1])
			
			
			if( (txt=='+' || txt=='-' || txt=='/' || txt=='*') && (right_side[p-1]==']' || !isNaN(string))){
				//console.log('herreeeee',string,last_operator)
					if(pointers_arr.length>0){
						pointers_arr.push(last_operator+string);
					}else{
						pointers_arr.push(string);
					}
					last_operator = txt
					
				string= ""
				
			}else{
				//console.log('elseeeee',txt)
				string = string+txt;
			}

			

		}
		pointers_arr.push(last_operator+string);

		console.log(pointers_arr,'pointers_arr')
		
		var output_column = left_side.split('(')[1].split(',')[0];
		var edge_point = left_side.split('(')[1].split(',')[1].split(')')[0];
		var pointers = pointers_arr;
		//  var pointers = right_side.split(']');
		//  console.log(pointers,'pointers')
		// for (var p = 0; p < pointers.length; p++) {
		// 	if (pointers[p] != '') {

		// 		var vTable = pointers[p].split(':')[0];

		// 		if (p > 0) {
		// 			vTable = pointers[p].split(':')[0].slice(1);
		// 			skeleton = skeleton + '~' + pointers[p].split(':')[0].charAt(0);
		// 		}

		// 		var p_col = pointers[p].split(':[')[1].split(',')[0];
		// 		console.log(pointers[p].split(',')[1],parseInt(pointers[p].split(',')[1]),'pointers[p]')
		// 		var p_row = pointers[p].split(',')[1];

		// 		var cp = parseInt(output_column) + parseInt(p_col)
		// 		var rr = p_row
		// 		fn_buffer.push({
		// 			vTable: tableInfo,
		// 			cp: cp,
		// 			rr: rr,
		// 			output_column: output_column,
		// 			virtual_table: vTable
		// 		});
		// 	}
		// 	console.log('skeleton',skeleton)
		// }
		var last_num_pointer = false
		for (var p = 0; p < pointers.length; p++) {
			//console.log(pointers[p],'pointers[p]pointers[p]',pointers.length,p)
			if (pointers[p] != '') {

				var ptr = pointers[p];
				//if any operator is in starting
				var is_pointer = ptr.charAt(0);
				if(is_pointer=='+' || is_pointer=='-' || is_pointer=='/' || is_pointer=='*'){
					ptr = ptr.replace(is_pointer,'');
				}


				if(!isNaN(ptr)){
					fn_buffer.push({
						vTable: tableInfo,
						output_column: output_column,
						value:ptr
						
					});
					if(p>0){
						if(last_num_pointer){
							skeleton = skeleton  + pointers[p];
						}else{
							skeleton = skeleton + '~' + pointers[p];
						}
						
						
					}else{
						skeleton = skeleton + pointers[p];
					}
					last_num_pointer = true
				}else{
					//console.log('ptrptrptrptr',ptr)
					//var ptr = pointers[p].replace(pointers[p].charAt(0),'');

					var vTable = ptr.split(':')[0];
					//console.log('ptrptrptrptr',vTable)

					if (p > 0) {
						//vTable = ptr.split(':')[0].slice(1);
						if(last_num_pointer){
							skeleton = skeleton +  pointers[p].split(':')[0].charAt(0);
						}else{
							skeleton = skeleton + '~' + pointers[p].split(':')[0].charAt(0);
						}
						last_num_pointer = false
					}

					 var p_col = ptr.split(':[')[1].split(',')[0];
					// console.log(ptr.split(',')[1],parseInt(ptr.split(',')[1]),'pointers[p]')
					 var p_row = ptr.split(',')[1].split(']')[0];

					 console.log(output_column,p_col,'ooooooooooooooooooooo')
					var cp = parseInt(output_column) + parseInt(p_col)
					var rr = p_row
					fn_buffer.push({
						vTable: tableInfo,
						cp: cp,
						rr: rr,
						output_column: output_column,
						virtual_table: vTable
					});
				}
			}

			//console.log('skeleton',skeleton)
		}

		console.log('fn_buffer',skeleton,fn_buffer)
		if(!last_num_pointer){
			skeleton = skeleton + '~';
		}
		console.log('skeleton',skeleton)
		resolve({ fn_buffer: fn_buffer, skeleton: skeleton , edge_point: edge_point })

	});
}

exports.addbits = async function (s) {
	
	if (s.indexOf(null) > -1) {
	
		return null;
	}else{
		
		try{
			var re = /^[-+]?[0-9]+\.[0-9]+$/;
			var cal = eval(s);
			if(cal.toString().match( re )){
				return trailing_zeros(cal);
			}else{
				return cal;
			}
		
		}catch(e){
			//console.log('err addbit',e)
			return 0;
		
		}
	}
}

//exports.updateTableCell = async function(db, output_table_info, updateCol, val, wherecol, wherecolVal) {
exports.updateTableCell = async function(db, output_table_info, updateCol, batchOperationData) {	
	
	console.log('idhr')
	return new Promise(async (resolve, reject) => {
  console.log('db',db)
	  if (db && db.status == 1) {

		var val = batchOperationData.value;

		//var where=' where ';
		// for(w=0;w<wherecolVal.length;w++){
		// 	if(w>0){
		// 		where = where+' and ';
		// 	}
		// 	where = where+ ' '+ wherecolVal[w].col +'= '+wherecolVal[w].val+' ';
		// }
		

		
			var where = ' where ';
			for(w=0;w<batchOperationData.where.length;w++){
				var wdata = batchOperationData.where;
				if(w>0){
					where = where+' and ';
				}
				where = where+ ' '+ wdata[w].col +'= '+wdata[w].val+' ';
			}

			
		


  
		//UPDATE clinets SET points = (CASE WHEN name='abc' and salary='25000' THEN ' 100' WHEN name = 'xyz' THEN ' 2' WHEN name= 'joy' THEN ' 3' ELSE 'field_namer' END)

		//var query = 'update ' + output_table_info.dbTable + ' set ' + updateCol + '=' + val + where
		var query = 'update ' + output_table_info.dbTable + '  set ' + updateCol + '=' + val + where
		console.log(query,'query')
		db.connection.query(query, function (error, results, fields) {
		  if (error) {
			console.log(error)
			reject(0)
		  } else {
			resolve(results)
		  }
		});
  
  
	  } else {
  console.log('errrrrr hereeee')
		reject(0)
	  }
	});
}

exports.checkIfUniqueCallExist = async function(functions){

}
function trailing_zeros(number) {
    number = number.toFixed(2);
    console.log(number);
    return number;
}