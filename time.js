const offset = 9;

function now() {
    return Date.now() + (3600000 * offset);
}

function duration(totalSeconds) {
    let remaining = totalSeconds;
    let units = [];
    const days = Math.floor(remaining / 86400);
    if (days > 0) units.push(`${days} days`);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    if (hours > 0) units.push(`${hours} hours`);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    if (minutes > 0) units.push(`${minutes} minutes`);
    const seconds = Math.floor(remaining % 60);
    if (seconds > 0) units.push(`${seconds} seconds`);
    return units.slice(0, 3).join(", ");
}

module.exports = {
    jst: now,
    duration: duration
}