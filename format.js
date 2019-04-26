const df = require("dateformat");
const jst = require("./jst");
const wiki = require("./wiki/api");

function duration(totalSeconds) {
    var remaining = totalSeconds;
    var units = [];
    const days = Math.floor(remaining / 86400);
    if (days > 0) units.push(`${days} days`);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    if (hours > 0) units.push(`${hours} hours`);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    if (minutes > 0) units.push(`${minutes} minutes`);
    const seconds = remaining % 60;
    if (seconds > 0) units.push(`${seconds} seconds`);
    return units.join(", ");
}

function firstLetterUpper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function eventList(events) {
    const now = jst.now();
    const nows = Math.floor(now / 1000);
    const fields = events.map(event => {
        var name = event["name"];

        if (event["unf element"]) {
            name += ` (${firstLetterUpper(event["unf element"])})`;
        }

        var period = `${df(new Date(event["jst start"] * 1000), "mmmm d")} – ${df(new Date(event["jst end"] * 1000), "mmmm d")}`;

        if (event["wiki page"]) {
            period = `[${period}](${wiki.host}/${encodeURIComponent(event["wiki page"])})`;
        }

        if (nows > event["jst start"]) {
            period += ` **(Ends in ${duration(event["jst end"] - nows)})**`;
        }

        return {
            name: name,
            value: period
        };
    });

    return {
        title: "Current and upcoming events",
        url: `${wiki.host}/Events`,
        fields: fields,
        footer: {
            text : `Current time in JST is ${df(new Date(now), "UTC:H:MM, mmmm d, yyyy")}`
        }
    };
}

module.exports = {
    buildEventList: eventList
}