const df = require("dateformat");
const jst = require("./jst");
const wiki = require("./wiki/api");

const author = {
    name: "Granblue Fantasy Wiki",
    icon_url: `${wiki.host}/images/1/18/Vyrnball.png`
}

function duration(totalSeconds) {
    let remaining = totalSeconds;
    let units = [];
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
    return units.slice(0, 3).join(", ");
}

function firstLetterUpper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateFieldValue(str) {
    if (str.length > 1024) {
        return str.substring(0, 1021) + "...";
    }
    else return str;
}

function eventList(events) {
    const now = jst.now();
    const nows = Math.floor(now / 1000);
    const fields = events.map(event => {
        let name = event["name"];

        if (event["unf element"]) {
            name += ` (${firstLetterUpper(event["unf element"])})`;
        }

        let period = `${df(new Date(event["jst start"] * 1000), "mmmm d")} – ${df(new Date(event["jst end"] * 1000), "mmmm d")}`;

        if (event["wiki page"]) {
            period = `[${period}](${wiki.host}/${encodeURIComponent(event["wiki page"])})`;
        }

        // Current events
        if (nows > event["jst start"]) {
            period += ` **(Ends in ${duration(event["jst end"] - nows)})**`;
        }
        // Events starting within 3 days
        else if (event["jst start"] - nows < 259200) {
            period += ` **(Starts in ${duration(event["jst start"] - nows)})**`;
        }

        return {
            name: name,
            value: period
        };
    });

    return {
        author: author,
        title: "**Current and upcoming events**",
        url: `${wiki.host}/Events`,
        fields: fields,
        footer: {
            text : `Current time in JST is ${df(new Date(now), "UTC:H:MM, mmmm d, yyyy")}`
        }
    };
}

function character(char) {
    const fields = [
        {
            name: "Rarity / Element / Race / Style",
            value: `${char.rarity} / ${char.element} / ${char.race} / ${char.type}`,
        },
        {
            name: "Weapon",
            value: `${char.weapons.join(" / ")}`,
            inline: true
        },
        {
            name: "HP / ATK",
            value: `${char.hp} / ${char.atk}`,
            inline: true
        },
        {
            name: "Charge Attack",
            value: truncateFieldValue(char.ougis.map(ougi => `**${ougi.label ? ougi.label : ""}${ougi.name}**\n${ougi.description}`).join("\n"))
        }
    ]
    
    char.skills.forEach((skill, i) => {
        fields.push({
            name: `Skill ${i + 1} – ${skill.name}`,
            value: truncateFieldValue(skill.description)
        });
    });

    fields.push({
        name: "Support Skills",
        value: truncateFieldValue(char.supports.map(support => `**${support.name}**\n${support.description}`).join("\n"))
    })

    return {
        author: author,
        title: `**${char.name}**`,
        url: char.url,
        thumbnail: { url: char.thumbnail },
        fields: fields
    };
}

module.exports = {
    buildEventList: eventList,
    characterEmbed: character
}