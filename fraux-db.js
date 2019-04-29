const mysql = require("mysql");

require("dotenv").config();
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.FRAUX_DB_HOST,
    port: process.env.FRAUX_DB_PORT,
    user: process.env.FRAUX_DB_USER,
    password: process.env.FRAUX_DB_PASSWORD,
    database: process.env.FRAUX_DB_NAME,
});

function queryPromise(query, args) {
    return new Promise((resolve, reject) => {
        db.query(query, args, function (error, results, fields) {
            if (error) reject(error);
            resolve(results, fields);
          });
    });
}

function getAllServerSettings() {
    return queryPromise("select discord_server, json from server_settings");
}

function writeServerSettings(serverId, settings) {
    var json = JSON.stringify(settings);
    return queryPromise(`insert into server_settings (discord_server, json) values ("${serverId}", ?) on duplicate key update json=?;`, [json, json]);
}

module.exports = {
    getAllServerSettings: getAllServerSettings,
    writeServerSettings: writeServerSettings
}