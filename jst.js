const offset = 9;

function now() {
    return Date.now() + (3600000 * offset);
}

module.exports = {
    now: now
}