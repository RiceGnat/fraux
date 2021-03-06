const wiki = require("./wiki/api");
const format = require("./wiki/format");
const whens = require("./fraux-whens");

function senderHasHigherRole(userId, server) {
    return !server.members.get(userId).manageable;
}

function handler(cmd) {
    cmd.add("wiki",
        "<action>",
        `Get info from [gbf.wiki](https://gbf.wiki/)`,
        "Wiki");

    cmd.addsub("events",
        "",
        "Get events",
        "wiki",
        (context) => wiki.getCurrentEvents()
            .then(results => format.buildEventList(results))
            .then(embed => ({
                embed: embed
            }))
        );

    cmd.addsub("char",
        "<name>",
        "Get character info",
        "wiki",
        (context, ...args) => 
            wiki.getCharacter(args.join(" "))
            .then(results => format.characterEmbed(results))
            .then(embed => ({
                embed: embed
            }), error => ({
                message: error
            }))
        );

    cmd.addsub("summon",
        "<name>",
        "Get summon info",
        "wiki",
        (context, ...args) => 
            wiki.getSummon(args.join(" "))
            .then(results => format.summonEmbed(results))
            .then(embed => ({
                embed: embed
            }), error => ({
                message: error
            }))
        );

    cmd.add("whens",
        "<option>",
        "Check times",
        "Time");

    cmd.addsub("reset",
        "",
        "How long until daily reset",
        "whens",
        (context) => ({
            message: whens.daily()
        }));

    cmd.addsub("weekly",
        "",
        "How long until weekly reset",
        "whens",
        (context) => ({
            message: whens.weekly()
        }));
        
    cmd.addsub("monthly",
        "",
        "How long until monthly reset",
        "whens",
        (context) => ({
            message: whens.monthly()
        }));
        
    cmd.addsub("st",
        "",
        "How long until strike time",
        "whens",
        (context) => {
            if (context.sender.serverId) {
                return {
                    message: whens.strikeTime(context.settings.getStrikeTime(context.sender.serverId))
                };
            }
        });

    cmd.add("set",
        "<option> <value>",
        "Set options",
        "Settings");

    cmd.addsub("st",
        "<hour> <hour>",
        "Set strike time (24hr JST)",
        "set",
        (context, st1, st2) => {
            if (context.sender.serverId &&
                senderHasHigherRole(context.sender.userId, context.message.guild, context.bot)) {
                return context.settings.setStrikeTime(context.sender.serverId, st1, st2)
                    .then(results => ({
                        message: "Strike time saved"
                    }), error => ({
                        message: error
                    }));
            }
        });
    
    cmd.help({
        title: `Fraux v${require("./package.json").version}`,
        description: "Granblue Fantasy utility bot. For more information, see [GitHub](https://github.com/RiceGnat/fraux/).\nIcon by [@creepy_himecchi](https://twitter.com/creepy_himecchi/status/1105333289747771393).",
        footer: { text: `Developed by RiceGnat#9420` }
    });
}

module.exports = {
    handler: handler
}