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
}

module.exports = {
    setup: setup
}