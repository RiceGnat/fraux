const wiki = require("./wiki/api");
const format = require("./wiki/format");
const resets = require("./resets");

function setup(cmd) {
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
                to: context.sender.channelId,
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
                to: context.sender.channelId,
                embed: embed
            }), error => ({
                to: context.sender.channelId,
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
                to: context.sender.channelId,
                embed: embed
            }), error => ({
                to: context.sender.channelId,
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
            to: context.sender.channelId,
            message: resets.daily()
        }));

    cmd.addsub("weekly",
        "",
        "How long until weekly reset",
        "whens",
        (context) => ({
            to: context.sender.channelId,
            message: resets.weekly()
        }));
        

    cmd.addsub("monthly",
        "",
        "How long until monthly reset",
        "whens",
        (context) => ({
            to: context.sender.channelId,
            message: resets.monthly()
        }));

    cmd.help({
        title: `Fraux v${require("./package.json").version}`,
        description: "Granblue Fantasy utility bot. For more information, see [GitHub](https://github.com/RiceGnat/fraux/).\nIcon by [@creepy_himecchi](https://twitter.com/creepy_himecchi/status/1105333289747771393).",
        footer: { text: `Developed by RiceGnat#9420` }
    });
}

module.exports = {
    setup: setup
}