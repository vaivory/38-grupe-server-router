import crypto from 'crypto';
import config from '../config.js';


const utils = {};

utils.hash = (str) => {  //shifravimas
    if (typeof str === 'string' && str !== '') {
        const hashedStr = crypto
            .createHmac('sha512', config.hashingSecret)
            .update(str)
            .digest('hex');
        return [false, hashedStr];
    }
    return [true, 'Uzsifruoti galima tik ne tuscia teksta'];
}

utils.fileExtension = (URL) => {
    // services -> undefined
    // services/design -> undefined
    // css/main.css -> css
    return URL.split('.')[1];
}

utils.parseJSONtoObject = (str) => {
    try {
        return [false, JSON.parse(str)];
    } catch (error) {
        return [true, 'ERROR'];
    }
}

/**
 * Duomenu objekto validatorius, kuris tikrina, ar duomenu objekte yra tik leistini raktazodziai.
 * 
 * Objekte gali buti ir papildomu neprivalomu, bet vis vien leistinu raktazodziu (optional keys)
 * @param {Object} obj Duomenu objektas
 * @param {Object} rules Nustatymu objektas
 * @param {[]?} rules.required Privalomu raktazodziu sarasas
 * @param {[]?} rules.optional Neprivalomu raktazodziu sarasas
 * @returns {[boolean, string]} Rezultatas, kur pirmasis parametras reiskia ar buvo rasta klaida, o antrasis - zinute (aprasanti klaida)
 */
utils.objectValidator = (obj, rules) => {
    if (typeof obj !== 'object'
        || obj === null
        || Array.isArray(obj)) {
        return [true, 'Neduotas objektas'];
    }

    if (typeof rules !== 'object'
        || rules === null
        || Array.isArray(rules)) {
        return [true, 'Neduotas strukturos objektas'];
    }

    if (!('required' in rules)) {
        rules.required = [];
    }
    if (!('optional' in rules)) {
        rules.optional = [];
    }

    const objKeys = Object.keys(obj);
    const { required, optional } = rules;
    const totalRulesKeys = [...required, ...optional];

    for (const reqKey of required) {
        if (!objKeys.includes(reqKey)) {
            return [true, `Truksta privalomo key "${reqKey}"`];
        }
    }

    for (const objKey of objKeys) {
        if (!totalRulesKeys.includes(objKey)) {
            return [true, `Pateiktas netinkamas/perteklinis key "${objKey}"`];
        }
    }

    return [false, 'OK'];
}

utils.browserDetection=(str) => {  //nustatom kokia narsykle per user agent browser
    if (str.includes('Trident/')) {
        return 'Narsykle IE';
    }
    if (str.includes('Firefox/')) {
        return 'Narsykle Firefox';
    }
    if (str.includes('Edg/')) {
        return 'Narsykle Edge';
    }
    if (str.includes('Chrome/')) {
        return 'Narsykle Chrome';
    }
    if (str.includes('Safari/')) {
        return 'Narsykle Safari';
    }
    if (str.includes('OPR/') || str.includes('Opera/')) {
        return 'Narsykle Opera';
    }
    return 'Serveriui nepazystama narsykle';
}
export { utils };

