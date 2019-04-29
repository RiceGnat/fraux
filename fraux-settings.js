let db;
let settings;

function init(db) {
    this.db = db;
    this.settings = {};
    return db.getAllServerSettings()
        .then(results => {
            results.forEach(row => {
                settings[row.discord_server] = row.json;
            });
        })
    
}

function getForServer(id, key) {
    return settings[id][key];
}

function setForServer(id, key, value) {
    let s = settings;
    s[id][key] = value;
    db.writeServerSettings(id, s)
        .then(results => {
            settings = s;
        });
}

module.exports = {
    init: init,
    getForServer: getForServer,
    setForServer: setForServer
}