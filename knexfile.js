// Update with your config settings.
module.exports = {
  development: {
    client: 'mysql',
    connection: {
      // hostname: 'localhost',
      host: 'localhost',
      database: 'pol',
      user: 'root',
      password: 'testpassword',
      port: '3306'
    },
    pool: {
      min: 0,



    },
    migrations: {
      tableName: 'migrations'
    }
  },
//   staging: {
//     client: 'mysql',
//     connection: {
//       hostname: 'http://localhost:3306',
//       database: 'pol',
//       user: 'root',
//       password: 'roots@123'
//     },
//     pool: {
//       min: 2,
//       max: 10
//     },
//     migrations: {
//       tableName: 'migrations'
//     }
//   },
//   production: {
//     client: 'mysql',
//     connection: {
//       hostname: 'http://localhost:3306',
//       database: 'pol',
//       user: 'root',
//       password: 'roots@123'
//     },
//     pool: {
//       min: 2,
//       max: 10
//     },
//     migrations: {
//       tableName: 'migrations'
//     }
//   }
};
