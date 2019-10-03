const cmd = require("./fraux-cmd");
const db = require("./fraux-db");
const settings = require("./fraux-settings");

require("dotenv").config();

const bot = require("wumpus").bot(
    process.env.BOT_TOKEN,
    "!",
    {
        settings: settings
    },
    cmd.handler
);

settings.init(db)
    .then(() => console.log("Settings loaded from database"),
    error => {
        console.log("Error loading settings from database:");
        console.log(error);
    });