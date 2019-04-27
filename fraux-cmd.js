const wiki = require("./wiki/api");
const format = require("./format");

function setup(cmd) {
    cmd.add("wiki",
        "<action>",
        "Get info from gbf.wiki",
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

    cmd.help({
        title: `Fraux v${require("./package.json").version}`,
        description: "Granblue Fantasy utility bot. For more information, see [GitHub](https://github.com/RiceGnat/fraux/).\nIcon by [@creepy_himecchi](https://twitter.com/creepy_himecchi/status/1105333289747771393).",
        footer: { text: `Developed by RiceGnat#9420` }
    });
}

module.exports = {
    setup: setup
}