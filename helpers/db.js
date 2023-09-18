var mysql = require('mysql2');
const stream = require('stream');
const { createPool } = require('mysql2');
var MySQl = require('./mysql');
var PostgreSQL = require('./postgres');
const SqlLite = require('./sqlite')

//create connection to database by host,user,password and database. For this mysql2 package is used tomake connection to mysql 
exports.createConnection = async function (config) {
	return new Promise((resolve, reject) => {
		if (config.type == 'PostgreSQL') {
			//console.log(config, 'config h herr')
			PostgreSQL.createConnection(config).then((connection) => {
				//console.log(connection, 'connection postgre')
				if (connection) {
					//console.log('connection here also ')
					resolve({
						connection: connection.connection,
						status: 1
					});
				} else {
					//console.log('here reject')
					reject({
						message: "error",
						status: 0
					});

				}
			}).catch((err)=>console.log(err,'errrrrr'));

		} else if (config.type == 'MySQL') {
			MySQl.createConnection(config).then((connection) => {

				if (connection) {
					//console.log('connection here also ')
					resolve({
						connection: connection.connection,
						status: 1
					});
				} else {
					//console.log('here reject')
					reject({
						message: "error",
						status: 0
					});

				}
			});
		}else if(config.type == 'SQLite'){
			console.log("config on connection",config)
			SqlLite.createConnection(config).then((connection)=>{
				if (connection) {
					console.log('connection success ')
					resolve({
						connection: connection.connection,
						status: 1
					});
				} else {
					//console.log('here reject')
					reject({
						message: "error",
						status: 0
					});

				}
			})
		}else {
			console.log('no one ')

		}
	}).catch((err) => {
		console.log('catch err db', err)
	})

}

async function makeConnection(config) {

	return new Promise((resolve, reject) => {
		if (config.type == 'PostgreSQL') {
			//console.log(config, 'config h herr')
			PostgreSQL.createConnection(config).then((connection) => {
				//console.log(connection, 'connection postgre')
				if (connection) {
					//console.log('connection here also ')
					resolve({
						connection: connection.connection,
						status: 1
					});
				} else {
					//console.log('here reject')
					reject({
						message: "error",
						status: 0
					});

				}
			}).catch((err)=>console.log(err,'errrrrr'));

		} else if (config.type == 'MySQL') {
			MySQl.createConnection(config).then((connection) => {

				if (connection) {
					//console.log('connection here also ')
					resolve({
						connection: connection.connection,
						status: 1
					});
				} else {
					//console.log('here reject')
					reject({
						message: "error",
						status: 0
					});

				}
			});
		}else if(config.type == 'SQLite'){
			SqlLite.createConnection(config).then((connection)=>{
				if (connection) {
					//console.log('connection here also ')
					resolve({
						connection: connection.connection,
						status: 1
					});
				} else {
					//console.log('here reject')
					reject({
						message: "error",
						status: 0
					});

				}
			})
		} else {
			console.log('no one ')

		}
	}).catch((err) => {
		console.log('catch err db', err)
	})
}




//get the columns of a table
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

//Add pol column to a table
exports.addPolColumn = async function (data, table) {
	// return new Promise(async (resolve, reject) => {

	// 	//console.log('data.dbDetails')
	// 	var db = await makeConnection({
	// 		host: data.host,
	// 		user: data.username,
	// 		password: data.password,
	// 		database: data.database,


	// 	});


	// 	if (db && db.status == 1) {

			


	// 		db.connection.query("ALTER TABLE " + table + " ADD COLUMN pol int AUTO_INCREMENT PRIMARY KEY", function (error, results, fields) {

	// 			//console.log('fields', fields[0].name)
	// 			if (error) {
	// 				console.log('err', error)
	// 				reject(0)
	// 			} else {
	// 				resolve({ results: results, fields: fields })
	// 			}
	// 		});

	// 	} else {
	// 		reject(0)
	// 	}
	// });

	return new Promise(async (resolve, reject) => {
		
		if (data.type == 'PostgreSQL') {
			var uniqueCall = await PostgreSQL.addPolColumn(data, table);
			console.log(uniqueCall,'uniqueCalluniqueCall o O O')
			resolve(uniqueCall)
		  } else if (data.type == 'MySQL') {
			var uniqueCall = await MySQl.addPolColumn(data, table);
			resolve(uniqueCall)
		  } else {
			reject(0)
			
		  }
	});


}

//get the result set from table 
exports.getTableResultSet = async function (config, no_of_rows = null) {

	var data = config.dbDetails
	var table = config.dbTable
	var datalink = config.dataLinkDetail
	console.log(config,'config UU U ')
	return new Promise(async (resolve, reject) => {

		if(table!=''){

			if (data.type == 'PostgreSQL') {
				var results = await PostgreSQL.getTableData(data, table);
				resolve({ results: results, fields: config.fields })
			} else if (data.type == 'MySQL') {
				var results = await MySQl.getTableData(data, table);
				resolve({ results: results, fields: config.fields })
			} else {
				reject(0)
			}
		}else if(datalink!=''){
			if (data.type == 'PostgreSQL') {
				var results = await PostgreSQL.getSqlData(data, datalink.sql);
				resolve({ results: results, fields: config.fields })
			  } else if (data.type == 'MySQL') {
				var results = await MySQl.getSqlData(data, datalink.sql);
				resolve({ results: results, fields: config.fields })
			  } else {
				reject(0)
				
			  }
		}else{
			reject(0)
		}
	});
}

// //get and return if there is some unique,primary etc column exist or not
exports.getUniqueCol = async function (data, table) {

	return new Promise(async (resolve, reject) => {
		
		if (data.type == 'PostgreSQL') {
			var uniqueCall = await PostgreSQL.getUniqueCol(data, table);
			console.log(uniqueCall,'uniqueCalluniqueCall')
			resolve(uniqueCall)
		  } else if (data.type == 'MySQL') {
			var uniqueCall = await MySQl.getUniqueCol(data, table);
			resolve(uniqueCall)
		  } else {
			reject(0)
			
		  }
	});
}

//get the val;ue of cell by row and col value
exports.getValueFromResultSet = async function (resultSet, row, col, edge_point = 0) {

	return new Promise((resolve, reject) => {
		row = parseInt(row)
		col = parseInt(col)

		if (resultSet.length >= row) {
			var c = 0;
			for (const v in resultSet[row]) {
				if (c == col) {

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


//to make the function buffer
exports.makeFunctionbuffer = async function (fn, tableInfo) {


	return new Promise((resolve, reject) => {

		var fn_buffer = [];
		var skeleton = '';

		var right_side = fn.split('=')[1];
		right_side = right_side.split(" ").join("")
		var left_side = fn.split('=')[0];

		var pointers_arr = [];
		var string = "";
		var last_operator = "";
		//console.log('rrrrrr',right_side)
		for (p = 0; p < right_side.length; p++) {
			var txt = right_side[p];

			//console.log(right_side[p],'rrrrr ppp',right_side[p-1])


			if ((txt == '+' || txt == '-' || txt == '/' || txt == '*') && (right_side[p - 1] == ']' || !isNaN(string))) {
				//console.log('herreeeee',string,last_operator)
				if (pointers_arr.length > 0) {
					pointers_arr.push(last_operator + string);
				} else {
					pointers_arr.push(string);
				}
				last_operator = txt

				string = ""

			} else {
				//console.log('elseeeee',txt)
				string = string + txt;
			}



		}
		pointers_arr.push(last_operator + string);

		console.log(pointers_arr, 'pointers_arr')

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
				if (is_pointer == '+' || is_pointer == '-' || is_pointer == '/' || is_pointer == '*') {
					ptr = ptr.replace(is_pointer, '');
				}


				if (!isNaN(ptr)) {
					fn_buffer.push({
						vTable: tableInfo,
						output_column: output_column,
						value: ptr

					});
					if (p > 0) {
						if (last_num_pointer) {
							skeleton = skeleton + pointers[p];
						} else {
							skeleton = skeleton + '~' + pointers[p];
						}


					} else {
						skeleton = skeleton + pointers[p];
					}
					last_num_pointer = true
				} else {
					//console.log('ptrptrptrptr',ptr)
					//var ptr = pointers[p].replace(pointers[p].charAt(0),'');

					var vTable = ptr.split(':')[0];
					//console.log('ptrptrptrptr',vTable)

					if (p > 0) {
						//vTable = ptr.split(':')[0].slice(1);
						if (last_num_pointer) {
							skeleton = skeleton + pointers[p].split(':')[0].charAt(0);
						} else {
							skeleton = skeleton + '~' + pointers[p].split(':')[0].charAt(0);
						}
						last_num_pointer = false
					}

					var p_col = ptr.split(':[')[1].split(',')[0];
					// console.log(ptr.split(',')[1],parseInt(ptr.split(',')[1]),'pointers[p]')
					var p_row = ptr.split(',')[1].split(']')[0];

					console.log(output_column, p_col, 'ooooooooooooooooooooo')
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

		console.log('fn_buffer', skeleton, fn_buffer)
		if (!last_num_pointer) {
			skeleton = skeleton + '~';
		}
		console.log('skeleton', skeleton)
		resolve({ fn_buffer: fn_buffer, skeleton: skeleton, edge_point: edge_point })

	});
}

exports.addbits = async function (s) {

	if (s.indexOf(null) > -1) {

		return null;
	} else {

		try {
			var re = /^[-+]?[0-9]+\.[0-9]+$/;
			var cal = eval(s);
			if (cal.toString().match(re)) {
				return trailing_zeros(cal);
			} else {
				return cal;
			}

		} catch (e) {
			//console.log('err addbit',e)
			return 0;

		}
	}
}

//exports.updateTableCell = async function(db, output_table_info, updateCol, val, wherecol, wherecolVal) {
exports.updateTableCell = async function (db, output_table_info, updateCol, batchOperationData) {


	return new Promise(async (resolve, reject) => {

		if (db && db.status == 1) {

			var val = batchOperationData.value;


			var where = ' where ';
			for (w = 0; w < batchOperationData.where.length; w++) {
				var wdata = batchOperationData.where;
				if (w > 0) {
					where = where + ' and ';
				}
				where = where + ' ' + wdata[w].col + '= ' + wdata[w].val + ' ';
			}

			//UPDATE clinets SET points = (CASE WHEN name='abc' and salary='25000' THEN ' 100' WHEN name = 'xyz' THEN ' 2' WHEN name= 'joy' THEN ' 3' ELSE 'field_namer' END)
			var query = 'update ' + output_table_info.dbTable + '  set ' + updateCol + '=' + val + where
			console.log(query, 'query')
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

function trailing_zeros(number) {
	number = number.toFixed(2);
	console.log(number);
	return number;
}