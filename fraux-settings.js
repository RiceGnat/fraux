var db;
var settings;

function init(frauxDb) {
    db = frauxDb;
    settings = {};
    return db.getAllServerSettings()
        .then(results => {
            results.forEach(row => {
                settings[row.discord_server] = JSON.parse(row.json);
            });
        })
}

function getForServer(id, key) {
    return settings[id][key];
}

function setForServer(id, key, value) {
    let s = settings;

    if (!s[id]) {
        s[id] = {};
    }

    s[id][key] = value;
    return db.writeServerSettings(id, s[id])
        .then(results => {
            settings = s;
        });
}

function validate24Hr(hour) {
    return hour >= 0 && hour < 24;
}

module.exports = {
    init: init,
    getStrikeTime: (serverId) => getForServer(serverId, "striketime"),
    setStrikeTime: (serverId, st1, st2) => {
        let h1 = parseInt(st1);
        let h2 = parseInt(st2);
        if (validate24Hr(h1) && validate24Hr(h2)) {
            return setForServer(serverId, "striketime", [h1, h2])
                .catch(error => {
                    console.log(error);
                    throw "Couldn't connect to the database";
                });
        }
        else return Promise.reject("Time must be an hour using a 24-hour clock (0-23)");
    }
}