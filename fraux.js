const cmd = require("./fraux-cmd");

require("dotenv").config();

const bot = require("wumpus").bot(
    process.env.BOT_TOKEN,
    "!",
    {},
    cmd.setup
);