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

            // Sort results to get default page at the top
            body[1].sort();
            body[3].sort();

            // Return first result
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
    if (text.match(/{{Character\W/i) !== null) return true;
    else return false;
}

function isSummonPage(text) {
    if (text.match(/{{Summon\W/i) !== null) return true;
    else return false;
}

function findSummonRef(text) {
    let matches = text.match(/{{About\s*\|[ \w]*\|.*\s*the summon[^\|]*\|([^\|}]+)/i);
    if (matches) return matches[1];
    else return null;
}

function safeMatch(text, regex) {
    let matches = text.match(regex);
    return matches ? matches[1] : null;
}

function parseCharacter(text, pagename, url) {
    const char = {};

    try {
        // Matching depends on the wikitext parameters being separated by newlines!

        // Page title and url are returned from search
        char.pagename = pagename;
        char.url = url;

        // Name (separate from page name)
        char.name = safeMatch(text, /\|name *= *(.+)/);

        // GBF asset ID
        char.id = safeMatch(text, /\|id *= *(\d+)/);

        // Square inventory tile (works better with Discord embed)
        char.thumbnail = `${host}/Special:Redirect/file/Npc_s_${char.id}_01.jpg`;

        // Uncap level
        char.base = safeMatch(text, /\|base_evo *= *(\d+)/);
        char.uncap = safeMatch(text, /\|max_evo *= *(\d+)/);

        // Release dates
        let date = safeMatch(text, /\|release_date *= *(.+)/);
        char.released = date ? new Date(date) : null;
        date = safeMatch(text, /\|5star_date *= *(.+)/);
        char.uncapped = date ? new Date(date) : null;
        
        // Rarity
        char.rarity = safeMatch(text, /\|rarity *= *(.+)/);

        // Element
        char.element = safeMatch(text, /\|element *= *(.+)/);

        // Race
        char.race = safeMatch(text, /\|race *= *(.+)/);

        // Character style (ATK, DEF, BAL, SPEC, HEAL)
        char.type = safeMatch(text, /\|type *= *(.+)/);

        // Weapon proficiency
        char.weapons = safeMatch(text, /\|weapon *= *(.+)/).split(",");

        // Max ATK and HP values
        char.atk = safeMatch(text, /\|flb_atk *= *(\d+)/) || safeMatch(text, /\|max_atk *= *(\d+)/);
        char.hp = safeMatch(text, /\|flb_hp *= *(\d+)/) || safeMatch(text, /\|max_hp *= *(\d+)/);

        // Ougis
        let count = safeMatch(text, /\|ougi_count *= *(\d+)/);
        char.ougis = [];
        for (let i = 0; i < count; i++) {
            // Don't use "1" for the first entry
            let n = i == 0 ? "" : i + 1;

            char.ougis[i] = {
                name: safeMatch(text, `\\|ougi${n}_name *= *(.+)`),
                description: safeMatch(text, `\\|ougi${n}_desc *= *(.+)`),
                label: safeMatch(text, `\\|ougi${n}_label *= *(.+)`)
            }
        }

        // Skills
        count = safeMatch(text, /\|abilitycount *= *(\d+)/);
        char.skills = [];
        for (let i = 0; i < count; i++) {
            let n = i + 1;

            char.skills[i] = {
                name: safeMatch(text, `\\|a${n}_name *= *(.+)`),
                description: safeMatch(text, `\\|a${n}_effdesc *= *(.+)`)
            }
        }

        // Support skills
        count = safeMatch(text, /\|s_abilitycount *= *(\d+)/);
        char.supports = [];
        for (let i = 0; i < count; i++) {
            // Don't use "1" for the first entry
            let n = i == 0 ? "" : i + 1;

            char.supports[i] = {
                name: safeMatch(text, `\\|sa${n}_name *= *(.+)`),
                description: safeMatch(text, `\\|sa${n}_desc *= *(.+)`)
            }
        }

        // EMP support skill
        let emp = safeMatch(text, /\|sa_emp_desc *= *(.+)/);
        if (emp) {
            char.supports.push({
                name: "Extended Mastery Support Skill",
                description: emp
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
        char.name.startsWith("{{") ? expandTemplate(char.name, pagename) // Sometimes the name field uses {{PAGENAME}}
            .then(name => char.name = name) : null,
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

function parseSummon(text, pagename, url) {
    const summon = {};

    try {
        // Page title and url are returned from search
        summon.pagename = pagename;
        summon.url = url;

        // Name (separate from page name)
        summon.name = safeMatch(text, /\|name *= *(.+)/);

        // GBF asset ID
        summon.id = safeMatch(text, /\|id *= *(\d+)/);

        // Square inventory tile (works better with Discord embed)
        summon.thumbnail = `${host}/Special:Redirect/file/Summon_s_${summon.id}.jpg`;
        
        // Uncap level
        summon.base = safeMatch(text, /\|base_evo *= *(\d+)/);
        summon.uncap = safeMatch(text, /\|max_evo *= *(\d+)/);

        // Release dates
        let date = safeMatch(text, /\|release_date *= *(.+)/);
        summon.released = date ? new Date(date) : null;
        date = safeMatch(text, /\|4star_date *= *(.+)/);
        summon.uncapped = date ? new Date(date) : null;
        date = safeMatch(text, /\|5star_date *= *(.+)/);
        summon.uncapped2 = date ? new Date(date) : null;
        
        // Rarity
        summon.rarity = safeMatch(text, /\|rarity *= *(.+)/);

        // Element
        summon.element = safeMatch(text, /\|element *= *(.+)/);

        // Max ATK and HP values
        summon.atk = safeMatch(text, /\|atk3 *= *(\d+)/) ||
                     safeMatch(text, /\|atk2 *= *(\d+)/) ||
                     safeMatch(text, /\|atk1 *= *(\d+)/);
        summon.hp =  safeMatch(text, /\|hp3 *= *(\d+)/) ||
                     safeMatch(text, /\|hp2 *= *(\d+)/) ||
                     safeMatch(text, /\|hp1 *= *(\d+)/);

        // Auras
        summon.auras = {
            main: [],
            sub: []
        };
        for (let i = 0; i < 4; i++) { // No count property, so just look for all auras (currently max 4)
            let n = i + 1;
            let aura = safeMatch(text, `\\|aura${n} *= *(.+)`);
            let sub = safeMatch(text, `\\|subaura${n} *= *(.+)`);

            // Let missing auras be undefined (eg SSR Arcarum summons)
            if (aura) {
                summon.auras.main[i] = aura;
            }
            
            if (sub) {
                summon.auras.sub[i] = sub;
            }
        }

        // Call
        summon.call = {
            name: safeMatch(text, /\|call_name *= *(.+)/),
            effects: []
        }
        summon.call.effects[0] = safeMatch(text, /\|call_base *= *(.+)/);
        summon.call.effects[1] = safeMatch(text, /\|call_mlb *= *(.+)/);
        summon.call.effects[2] = safeMatch(text, /\|call_flb *= *(.+)/);
        summon.call.effects[3] = safeMatch(text, /\|call_5s *= *(.+)/);
    }
    catch (ex) {
        // Catch exceptions so we can handle them as part of the promise flow
        return Promise.reject(ex);
    }

    return Promise.all([
        Promise.all(summon.auras.main.map(aura => aura ? expandTemplate(aura, pagename) : null))
            .then(results => {
                results.forEach((result, i) => {
                    summon.auras.main[i] = result;
                });
            }),
        Promise.all(summon.auras.sub.map(aura => aura ? expandTemplate(aura, pagename) : null))
            .then(results => {
                results.forEach((result, i) => {
                    summon.auras.sub[i] = result;
                });
            }),
        Promise.all(summon.call.effects.map(call => call ? expandTemplate(call, pagename) : null))
            .then(results => {
                results.forEach((result, i) => {
                    summon.call.effects[i] = result;
                });
            }),
        summon.name.startsWith("{{") ? expandTemplate(summon.name, pagename) // Sometimes the name field uses {{PAGENAME}}
            .then(name => summon.name = name) : Promise.resolve(),
        getLatestRevisionTime(pagename)
            .then(timestamp => summon.updated = new Date(timestamp))
    ]).then(() => summon);
}

function getSummon(pagename) {
    return search(pagename)
        .then(result => getRawPage(result.title)
            .then(text => {
                if (!isSummonPage(text)) {
                    let summonPage = findSummonRef(text);
                    if (summonPage) {
                        return getSummon(summonPage);
                    }
                    else throw `Not a summon page: ${result.url}`;
                }
                
                return parseSummon(text, result.title, result.url)
                    .catch(error => {
                        console.log(error);
                        throw `Something went wrong while parsing the page: ${result.url}`;
                    });
            })
        , error => {
            throw "Couldn't find that summon";
        });
}

module.exports = {
    getCurrentEvents: getCurrentEvents,
    getCharacter: getCharacter,
    getSummon: getSummon,
    host: host
}