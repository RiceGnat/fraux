
const df = require("dateformat");
const time = require("./util/time");

function setHour(date, hour) {
    date.setUTCHours(hour);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
}

function getNowShifted() {
    // Get current time in JST
    let now = time.jst();

    // Shift time -5 hrs so reset is at midnight
    now = time.shift(now, -5);

    return now;
}

function getResetTime(now) {
    // Calculate reset time as though it were at midnight
    let reset = new Date(now);
    reset.setUTCDate(reset.getUTCDate() + 1);
    setHour(reset, 0);
    return reset;
}

function getDuration(a, b) {
    return time.duration((a - b) / 1000);
}

function getActual(shifted) {
    let actual = shifted;
    time.shift(actual, 5);
    return actual;
}

function daily() {
    // Get current time in JST shifted -5 hrs
    let now = getNowShifted();

    // Calculate next reset
    let reset = getResetTime(now);

    // Check if it's a weekly/monthly reset
    const isWeekly = reset.getUTCDay() == 1; // 1 = Monday
    const isMonthly = reset.getUTCDate() == 1;

    // Build message
    let msg = `Daily reset is at 5:00 JST **(${getDuration(reset.getTime(), now)})**`;

    if (isWeekly && !isMonthly) {
        msg += "\nThe next reset starts a new week."
    }
    else if (isMonthly && !isWeekly) {
        msg += "\nThe next reset starts a new month."
    }
    else if (isWeekly && isMonthly) {
        msg += "\nThe next reset starts a new week and a new month."
    }

    return msg;
}

function weekly() {
    // Get current time in JST shifted -5 hrs
    let now = getNowShifted();

    // Calculate next reset
    let reset = getResetTime(now);
    reset.setUTCDate(reset.getUTCDate() + ((8 - reset.getUTCDay()) % 7));

    // Shift times +5 to print actual time
    let actual = getActual(reset);

    return `Weekly reset is at 5:00 JST on Monday, ${df(actual, "UTC:mmmm d, yyyy")} **(${getDuration(reset.getTime(), now)})**`;
}

function monthly() {
    // Get current time in JST
    let now = getNowShifted();

    // Calculate next reset
    let reset = getResetTime(now);
    reset.setUTCMonth(reset.getUTCMonth() + 1);
    reset.setUTCDate(1);

    // Shift times +5 to print actual time
    let actual = getActual(reset);

    return `Monthly reset is at 5:00 JST on ${df(actual, "UTC:dddd, mmmm d, yyyy")} **(${getDuration(reset.getTime(), now)})**`;
}

function strikeTime(st) {
    let now = time.jst();
    let remaining;

    let stDate = st.map(h => {
        let date = new Date(now);
        
        // If it's ST right now, get remaining time
        if (h == date.getUTCHours()) {
            let end = new Date(now);
            setHour(end, h + 1);
            remaining = end.getTime() - now;
        }

        let begin = new Date(now);
        // If this ST has already passed, set to tomorrow
        if (date.getUTCHours() >= h) {
            begin.setUTCDate(begin.getUTCDate() + 1);
        }
        setHour(begin, h);

        return begin;
    });

    let msg = "";

    if (remaining) {
        msg += `Right now! There are **${time.duration(remaining / 1000)} remaining**\n`;
    }

    msg += `Strike time is at ${df(stDate[0], "UTC:H:MM")} and ${df(stDate[1], "UTC:H:MM")} JST\n`;
    stDate.sort();
    msg += `The next one is in **${time.duration((Math.min(stDate[0].getTime(), stDate[1].getTime()) - now) / 1000)}**`;

    return msg;
}

module.exports = {
    daily: daily,
    weekly: weekly,
    monthly: monthly,
    strikeTime: strikeTime
}