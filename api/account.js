import { file } from "../lib/file.js";
import { IsValid } from "../lib/is-valid/IsValid.js";
import { utils } from "../lib/utils.js";

const handler = {};

handler.account = async (data, callback) => {
    // kliento intensija - ka jis nori daryti?
    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.includes(data.httpMethod)) {
        const httpMethodFunc = handler._innerMethods[data.httpMethod];
        return await httpMethodFunc(data, callback);
    }

    return callback(405, {
        msg: 'Tavo norimas HTTPmethod yra nepalaikomas',
    });
}

handler._innerMethods = {};

// GET
handler._innerMethods.get = (data, callback) => {
    return callback(200, {
        msg: 'Account: get'
    });
}

// POST - sukuriame paskyra
handler._innerMethods.post = async (data, callback) => {
    const { payload } = data;

    /*
    1) patikrinti, ar teisinga info (payload):
        - email
        - pass
        - fullname
        - isitikinti, jog atejusiame objekte nera kitu key's apart: email, fullname ir password
    */

    const [validErr, validMsg] = utils.objectValidator(payload, {
        required: ['fullname', 'email', 'pass'],
    });

    if (validErr) {
        return callback(400, {
            msg: validMsg,
        });
    }

    const { fullname, email, pass } = payload;

    const [fullnameErr, fullnameMsg] = IsValid.fullname(fullname);
    if (fullnameErr) {
        return callback(400, {
            msg: fullnameMsg,
        });
    }

    const [emailErr, emailMsg] = IsValid.email(email);
    if (emailErr) {
        return callback(400, {
            msg: emailMsg,
        });
    }

    const [passErr, passMsg] = IsValid.password(pass);
    if (passErr) {
        return callback(400, {
            msg: passMsg,
        });
    }

    /*
    2) ar toks vartotojas jau egzistuoja
        - jei taip - error
        - jei ne - tęsiam
    */

    // accounts/${user-email}.json
    const [readErr] = await file.read('accounts', email + '.json');
    if (!readErr) {
        return callback(400, {
            msg: 'Paskyra jau egzistuoja',
        })
    }

    /*
    3) issaugoti duomenis (payload)
        - jei pavyko - paskyra sukurta
            - siunciam patvirtinimo laiska
        - jei nepavyko - error
    */
        const [createErr] = await file.create('accounts', email + '.json', payload);
    if (createErr) {
        return callback(500, {
            msg: 'Nepavyko sukurti paskyrtos del vidines serverio klaidos. Pabandykite veliau',
        })
    }

    return callback(200, {
        msg: 'Paskyra sukurta sekmingai',
    });
}

// PUT (kapitalinis info pakeistimas) / PATCH (vienos info dalies pakeitimas)
handler._innerMethods.put = (data, callback) => {
    return callback(200, {
        msg: 'Account: put',
    });
}

// DELETE
handler._innerMethods.delete = (data, callback) => {
    return callback(200, {
        msg: 'Account: delete',
    });
}

export default handler;