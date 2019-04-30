
const df = require("dateformat");
const time = require("./time");

function daily() {
    let reset = new Date();

    // Reset is at 5am JST (8pm UTC)
    if (reset.getUTCHours() > 20) {
        // Today's reset already happened
        reset.setUTCDate(reset.getUTCDate() + 1);
    }

    reset.setUTCHours(20);
    reset.setUTCMinutes(0);
    reset.setUTCSeconds(0);
    reset.setUTCMilliseconds(0);

    const weekly = reset.getUTCDay() == 0;
    const monthly = reset.getUTCDate() == 1;

    let msg = `Daily reset is at 5:00 JST **(${time.duration((reset.getTime() - Date.now()) / 1000)})**`;

    if (weekly && !monthly) {
        msg += "\nThe next reset starts a new week."
    }
    else if (monthly && !weekly) {
        msg += "\nThe next reset starts a new month."
    }
    else if (weekly && monthly) {
        msg += "\nThe next reset starts a new week and a new month."
    }

    return msg;
}

function weekly() {
    let reset = new Date();

    // Weekly reset is at 5am Monday JST (8pm Sunday UTC)
    if (reset.getUTCDay() > 0 ||
        reset.getUTCHours() > 20) {
        // Weekly reset already happened
        reset.setUTCDate(reset.getUTCDate() + 7);
    }

    reset.setUTCHours(20);
    reset.setUTCMinutes(0);
    reset.setUTCSeconds(0);
    reset.setUTCMilliseconds(0);

    return `Weekly reset is Monday at 5:00 JST **(${time.duration((reset.getTime() - Date.now()) / 1000)})**`;
}

function monthly() {
    // Do this calc in JST because it's easier
    let reset = new Date(time.jst());

    // Monthly reset is at 5am JST on the 1st (8pm UTC on the last day of prev month)
    if (reset.getUTCDate() > 1 ||
        reset.getUTCHours() > 5) {
        // Monthly reset already happened
        reset.setUTCMonth(reset.getUTCMonth() + 1);
    }

    reset.setUTCDate(1);
    reset.setUTCHours(5);
    reset.setUTCMinutes(0);
    reset.setUTCSeconds(0);
    reset.setUTCMilliseconds(0);

    return `Monthly reset is at 5:00 JST on ${df(reset, "UTC:dddd mmmm d, yyyy")} **(${time.duration((reset.getTime() - time.jst()) / 1000)})**`;
}

function strikeTime(st) {
    let now = time.jst();
    let remaining;

    let stDate = st.map(h => {
        let date = new Date(now);
        
        // If it's ST right now
        if (h == date.getUTCHours()) {
            let end = new Date(now);
            end.setUTCHours(h + 1);
            end.setUTCMinutes(0);
            end.setUTCSeconds(0);
            end.setUTCMilliseconds(0);

            remaining = end.getTime() - now;
        }

        let begin = new Date(now);
        // If this ST has already passed, set to tomorrow
        if (date.getUTCHours() >= h) {
            begin.setUTCDate(begin.getUTCDate() + 1);
        }
        begin.setUTCHours(h);
        begin.setUTCMinutes(0);
        begin.setUTCSeconds(0);
        begin.setUTCMilliseconds(0);

        return begin;
    });

    let msg = "";

    if (remaining) {
        msg += `Right now! There are **${time.duration(remaining / 1000)} remaining**\n`;
    }

    msg += `Strike time is at ${df(stDate[0], "UTC:H:MM")} and ${df(stDate[1], "UTC:H:MM")} JST\n`;
    stDate.sort();
    msg += `The next one is in **${time.duration((stDate[0].getTime() - now) / 1000)}**`;

    return msg;
}

module.exports = {
    daily: daily,
    weekly: weekly,
    monthly: monthly,
    strikeTime: strikeTime
}