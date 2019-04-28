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

function getElementColor(element) {
    switch (element) {
        case "fire":
            return 11025964;
        case "water":
            return 3037091;
        case "earth":
            return 8802601;
        case "wind":
            return 2455617;
        case "light":
            return 13485160;
        case "dark":
            return 7227278;
    }
}

function uncapStars(base, max) {
    return base && max ? `\u2003${"\u2606".repeat(base)}${"\u2605".repeat(Math.max(0, max - base))}` : "";
}

function summonUncapFromIndex(index) {
    switch (index) {
        case 0: return "0\u2605";
        case 1: return "3\u2605";
        case 2: return "4\u2605";
        case 3: return "5\u2605";
    }
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
            value: `${char.rarity.toUpperCase()} / ${firstLetterUpper(char.element)} / ${firstLetterUpper(char.race)} / ${firstLetterUpper(char.type)}`,
        },
        {
            name: "Weapon",
            value: `${char.weapons.map(w => firstLetterUpper(w)).join(" / ")}`,
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
        title: `**${char.pagename}**${uncapStars(char.base, char.uncap)}`,
        url: char.url,
        color: getElementColor(char.element.toLowerCase()),
        thumbnail: { url: char.thumbnail },
        fields: fields,
        footer: {
            text: `Last wiki revision on ${df(char.updated, "UTC:mmm d, yyyy")}`
        }
    };
}

function summon(summon) {
    const fields = [
        {
            name: "Rarity / Element",
            value: `${summon.rarity.toUpperCase()} / ${firstLetterUpper(summon.element)}`,
            inline: true
        },
        {
            name: "HP / ATK",
            value: `${summon.hp} / ${summon.atk}`,
            inline: true
        }
    ]

    let auras = [];
    let subs = [];
    let calls = [];
    for (let i = 0; i < 4; i++) {
        if (summon.auras.main[i]) {
            auras.push(`**${summonUncapFromIndex(i)}:** ${summon.auras.main[i]}`);
        }

        if (summon.auras.sub[i]) {
            subs.push(`**${summonUncapFromIndex(i)}:** ${summon.auras.sub[i]}`);
        }

        if (summon.call.effects[i]) {
            calls.push(`**${summonUncapFromIndex(i)}:** ${summon.call.effects[i]}`);
        }
    }

    if (auras.length > 0) {
        fields.push({
            name: `${summon.name}'s Aura`,
            value: truncateFieldValue(auras.join("\n"))
        });
    }

    if (subs.length > 0) {
        fields.push({
            name: `Sub Aura`,
            value: truncateFieldValue(subs.join("\n"))
        });
    }

    if (calls.length > 0) {
        fields.push({
            name: `Call – ${summon.call.name}`,
            value: truncateFieldValue(calls.join("\n"))
        });
    }

    return {
        author: author,
        title: `**${summon.name}**${uncapStars(summon.base, summon.uncap)}`,
        url: summon.url,
        color: getElementColor(summon.element.toLowerCase()),
        thumbnail: { url: summon.thumbnail },
        fields: fields,
        footer: {
            text: `Last wiki revision on ${df(summon.updated, "UTC:mmm d, yyyy")}`
        }
    };
}

module.exports = {
    buildEventList: eventList,
    characterEmbed: character,
    summonEmbed: summon
}