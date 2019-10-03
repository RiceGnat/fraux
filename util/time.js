// jst offset
const offset = 9;

// get time in jst
function now() {
    return shiftHours(Date.now(), offset);
}

function pluralize(value, unit) {
    return `${value} ${unit}${value > 1 ? 's' : ''}`;
}

function duration(totalSeconds) {
    let remaining = totalSeconds;
    let units = [];
    const days = Math.floor(remaining / 86400);
    if (days > 0) units.push(pluralize(days, 'day'));
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    if (hours > 0) units.push(pluralize(hours, 'hour'));
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    if (minutes > 0) units.push(pluralize(minutes, 'minute'));
    const seconds = Math.floor(remaining % 60);
    if (seconds > 0) units.push(pluralize(seconds, 'second'));
    return units.slice(0, 3).join(", ");
}

function shiftHours(time, hours) {
    return time + (3600000 * hours);
}

module.exports = {
    jst: now,
    duration: duration,
    shift: shiftHours
}