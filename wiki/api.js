const request = require("request");
const jst = require("../jst");

const host = "https://gbf.wiki";

function getCurrentEvents() {
    const now = Math.floor(jst.now() / 1000);
    qs = {
        title: "Special:CargoExport",
        tables: "event_history",
        fields: "name,jst_start,jst_end,unf_element,wiki_page",
        where: `jst_start>${now} or jst_end>${now}`, // in case jst_end is undefined
        order_by: "jst_start",
        limit: 10,
        format: "json"
    }

    return new Promise((resolve, reject) => {
        request.get({
            url: `${host}/index.php`,
            qs: qs,
            json: true
        }, (err, resp, body) => {
            if (err || resp.statusCode !== 200) return reject(err ? err : resp.statusCode);
            resolve(body);
        });
    });
}

module.exports = {
    getCurrentEvents: getCurrentEvents,
    host: host
}