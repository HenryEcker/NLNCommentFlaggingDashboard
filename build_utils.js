module.exports = {
    buildTamperMonkeyPreamble: (userscript_config, globals) => {
        let preamble = ['// ==UserScript=='];

        let acc = [];
        let maxKeyLength = 0;
        Object.entries(userscript_config).forEach(([key, value]) => {
            if (value instanceof Array) {
                value.forEach(v => acc.push([key, v]));
            } else {
                acc.push([key, value]);
            }
            if (key.length > maxKeyLength) {
                maxKeyLength = key.length;
            }
        });
        acc.forEach(([key, value]) => {
            preamble.push(`// @${key.padEnd(maxKeyLength)} ${value}`);
        })

        if (globals.length > 0) {
            preamble.push('// ==/UserScript==');
            preamble.push(`/* globals ${globals.join(', ')} */`);
        }
        preamble.push('\n');
        return preamble.join('\n');
    }
};