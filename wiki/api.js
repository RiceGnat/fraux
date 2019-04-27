const request = require("request");
const jst = require("../jst");

const host = "https://gbf.wiki";

function getCurrentEvents() {
    const now = Math.floor(jst.now() / 1000);
    const qs = {
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

function search(pagename) {
    const qs = {
        action: "opensearch",
        search: pagename,
        redirects: "resolve",
        limit: 1,
        format: "json"
    }

    return new Promise((resolve, reject) => {
        request.get({
            url: `${host}/api.php`,
            qs: qs,
            json: true
        }, (err, resp, body) => {
            if (err || resp.statusCode !== 200) return reject(err ? err : resp.statusCode);
            
            if (body[1].length == 0) reject();

            // return first result
            resolve({
                title: body[1][0],
                url: body[3][0]
            });
        })
    });
}

function getLatestRevisionTime(pagename) {
    const qs = {
        action: "query",
        prop: "revisions",
        titles: pagename,
        format: "json"
    }

    return new Promise((resolve, reject) => {
        request.get({
            url: `${host}/api.php`,
            qs: qs,
            json: true
        }, (err, resp, body) => {
            if (err || resp.statusCode !== 200) return reject(err ? err : resp.statusCode);
            
            let results = body["query"]["pages"];

            resolve(results[Object.keys(results)[0]]["revisions"][0]["timestamp"]);
        })
    });
}

function getRawPage(pagename) {
    return new Promise((resolve, reject) => {
        request.get({
            url: `${host}/${encodeURIComponent(pagename)}?action=raw`
        }, (err, resp, body) => {
            if (err || resp.statusCode !== 200) return reject(err ? err : resp.statusCode);
            resolve(body);
        })
    });
}

function expandTemplate(text, pagename) {
    const qs = {
        action: "expandtemplates",
        title: pagename,
        text: text,
        prop: "wikitext",
        templatesandboxprefix: "User:RiceGnat/Discord",
        format: "json"
    }
    return new Promise((resolve, reject) => {
        request.get({
            url: `${host}/api.php`,
            qs: qs,
            json: true
        }, (err, resp, body) => {
            if (err || resp.statusCode !== 200) return reject(err ? err : resp.statusCode);

            let str = body.expandtemplates.wikitext;

            // Replace <br/> tags with \n
            str = str.replace(/< *br *\/ *>/g, "\n");

            // Replace inter wiki links
            str = str.replace(/\[\[(?:[^\]\|]+\|)?([^\]\|]+)\]\]/g, "$1");

            // Replace wiki bolding or italics with markdown italics
            str = str.replace(/'''?/g, "_");

            // Remove <ref> tags
            str = str.replace(/< *ref[^<>]*\/ *>/g, "");
            str = str.replace(/< *ref[^<>]*>[^<>]*<\/ref>/g, "");

            resolve(str);
        })
    });
}

function isCharacterPage(text) {
    if (text.match(/{{Character\W/) !== null) return true;
    else return false;
}

function parseCharacter(text, pagename, url) {
    const char = {};
    let matches;

    try {
        // Matching depends on the wikitext parameters being separated by newlines!

        // Page title and url are returned from search
        char.name = pagename;
        char.url = url;

        // GBF asset ID
        char.id = text.match(/\|id *= *(\d+)/)[1];

        // Square inventory tile (works better with Discord embed)
        char.thumbnail = `${host}/Special:Redirect/file/Npc_s_${char.id}_01.jpg`;

        // Release dates
        char.released = new Date(text.match(/\|release_date *= *(.+)/)[1]);
        matches = text.match(/\|5star_date *= *(.+)/);
        if (matches) {
            char.uncapped = new Date(matches[1]);
        }

        // Max ATK and HP values
        matches = text.match(/\|flb_atk *= *(\d+)/);
        char.atk = matches ? matches[1] : text.match(/\|max_atk *= *(\d+)/)[1];

        matches = text.match(/\|flb_hp *= *(\d+)/);
        char.hp = matches ? matches[1] : text.match(/\|max_hp *= *(\d+)/)[1];
        
        // Rarity
        char.rarity = text.match(/\|rarity *= *(.+)/)[1];

        // Element
        char.element = text.match(/\|element *= *(.+)/)[1];

        // Race
        char.race = text.match(/\|race *= *(.+)/)[1];

        // Character style (ATK, DEF, BAL, SPEC, HEAL)
        char.type = text.match(/\|type *= *(.+)/)[1];

        // Weapon proficiency
        char.weapons = text.match(/\|weapon *= *(.+)/)[1].split(",");

        // Ougis
        let count = text.match(/\|ougi_count *= *(\d+)/)[1];
        char.ougis = [];
        for (let i = 0; i < count; i++) {
            // Don't use "1" for the first entry
            let n = i == 0 ? "" : i + 1;

            char.ougis[i] = {
                name: text.match(`\\|ougi${n}_name\ *=\ *(.+)`)[1],
                description: text.match(`\\|ougi${n}_desc\ *=\ *(.+)`)[1],
            }

            matches = text.match(`\\|ougi${n}_label\ *=\ *(.+)`);
            if (matches) {
                char.ougis[i].label = matches[1];
            }
        }

        // Skills
        count = text.match(/\|abilitycount *= *(\d+)/)[1];
        char.skills = [];
        for (let i = 0; i < count; i++) {
            let n = i + 1;

            char.skills[i] = {
                name: text.match(`\\|a${n}_name\ *=\ *(.+)`)[1],
                description: text.match(`\\|a${n}_effdesc\ *=\ *(.+)`)[1]
            }
        }

        // Support skills
        count = text.match(/\|s_abilitycount *= *(\d+)/)[1];
        char.supports = [];
        for (let i = 0; i < count; i++) {
            // Don't use "1" for the first entry
            let n = i == 0 ? "" : i + 1;

            char.supports[i] = {
                name: text.match(`\\|sa${n}_name\ *=\ *(.+)`)[1],
                description: text.match(`\\|sa${n}_desc\ *=\ *(.+)`)[1]
            }
        }

        // EMP support skill
        matches = text.match(/\|sa_emp_desc *= *(.+)/);
        if (matches) {
            char.supports.push({
                name: "Extended Mastery Support Skill",
                description: matches[1]
            });
        }
    }
    catch (ex) {
        // Catch exceptions so we can handle them as part of the promise flow
        return Promise.reject(ex);
    }

    // Expand wiki text
    return Promise.all([
        Promise.all(char.ougis.map(ougi => expandTemplate(ougi.description, pagename)))
            .then(descs => {
                descs.forEach((desc, i) => {
                    char.ougis[i].description = desc;
                });
            }),
        Promise.all(char.ougis.map(ougi => ougi.label ? expandTemplate(ougi.label, pagename) : null))
            .then(labels => {
                labels.forEach((label, i) => {
                    // Don't want newlines in ougi labels
                    if (label) char.ougis[i].label = label.replace("\n", " ");
                });
            }),
        Promise.all(char.skills.map(skill => expandTemplate(skill.description, pagename)))
            .then(descs => {
                descs.forEach((desc, i) => {
                    char.skills[i].description = desc;
                });
            }),
        Promise.all(char.supports.map(support => expandTemplate(support.description, pagename)))
            .then(descs => {
                descs.forEach((desc, i) => {
                    char.supports[i].description = desc;
                });
            }),
        getLatestRevisionTime(pagename)
            .then(timestamp => char.updated = new Date(timestamp))
    ]).then(() => char);
}

function getCharacter(pagename) {
    return search(pagename)
        .then(result => getRawPage(result.title)
            .then(text => {
                if (!isCharacterPage(text)) {
                    throw `Not a character page: ${result.url}`;
                }

                return parseCharacter(text, result.title, result.url)
                    .catch(error => {
                        console.log(error);
                        throw `Something went wrong while parsing the page: ${result.url}`;
                    });
            })
        , error => {
            throw "Couldn't find that character";
        });
}

module.exports = {
    getCurrentEvents: getCurrentEvents,
    getCharacter: getCharacter,
    host: host
}