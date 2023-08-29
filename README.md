
## Getting started

### Requirements

1. You must download and install Node.js if you don't already have it.

2. After installing Node.js

Go to root directory :-
    Install Packages: Use npm install command to install all packages included in package.json.


#### Set env variables and connection details for production

1. Add stripe live secret key in env file.
2. Add live database connection details in knexfile.js
3. Inside package.json inside start script add use nodemon www(file inside bin directory. This file contains configuration for live server).
After that use pm2 process manager to start server.

#### Set env variables and connection details for local

1. Add stripe test secret key in env file.
2. Add local database connection details in knexfile.js
3. Inside package.json inside start script add use nodemon www@@(file inside bin directory. This file contains configuration for local server).
For local you can use npm , yarn etc.

After that use npm or yarn to start server on local.
Go to root directory :-
        Using npm:- npm start

### Sample knexfile
module.exports = {
  development: {
    client: '',
    connection: {
      hostname: '',
      host: '',
      database: '',
      user: '',
      password: '',
      port: ''
    },
    pool: {
      min: 0,
    },
    migrations: {
      tableName: 'migrations'
    }
  },
}