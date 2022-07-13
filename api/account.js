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
        return callback(400, ApiResponse.error(validMsg));
    }

    const { fullname, email, pass } = payload;

    const [fullnameErr, fullnameMsg] = IsValid.fullname(fullname);
    if (fullnameErr) {
        return callback(400, ApiResponse.error(fullnameMsg));
    }

    const [emailErr, emailMsg] = IsValid.email(email);
    if (emailErr) {
        return callback(400, ApiResponse.error(emailMsg));
    }

    const [passErr, passMsg] = IsValid.password(pass);
    if (passErr) {
        return callback(400, ApiResponse.error(passMsg));
    }

    /*
    2) ar toks vartotojas jau egzistuoja
        - jei taip - error
        - jei ne - tęsiam
    */

    // accounts/${user-email}.json
    const [readErr] = await file.read('accounts', email + '.json');
    if (!readErr) {
        return callback(400, ApiResponse.error('Paskyra jau egzistuoja'))
    }

    /*
    3) issaugoti duomenis (payload)
        - jei pavyko - paskyra sukurta
            - siunciam patvirtinimo laiska
        - jei nepavyko - error
    */
    delete payload.pass;
    payload.hashedPassword = utils.hash(pass)[1]; //musu uzshifruotas passwordas
    payload.lastLoginDate = 0;
    payload.registrationDate = Date.now();
    payload.IPaddress = '';
    payload.browser = data.user.browser;

    const [createErr] = await file.create('accounts', email + '.json', payload);  //cia bus visas musu atsiustas objektas
    if (createErr) {
        return callback(500, ApiResponse.error('Nepavyko sukurti paskyrtos del vidines serverio klaidos. Pabandykite veliau'))
    }
    return callback(201, ApiResponse.redirect('/login'));
}

// GET
handler._innerMethods.get = async (data, callback) => {

    // 1) suzinoti apie kuri vartotoja norima gauti duomenis
    const email = data.searchParams.get('email');

    // 2) Patikriname ar gautas email yra email formato
    const [emailErr, emailMsg] = IsValid.email(email);
    if (emailErr) {
        return callback(400, ApiResponse.error(emailMsg));
    }
    // 3) Bandom perskaityti vartotojo duomenis
    // - jei ERROR - vartotojas neegzistuoja
    // - jei OK - vartotojas egzistuoja ir gavom jo duomenis
    const [readErr, readMsg] = await file.read('accounts', email + '.json');
    if (readErr) {
        return callback(404, ApiResponse.error('Toks vartotojas neegzistouja, arba nepavyko gauti duomenu del teisiu trukumo'));
    }

    const [userErr, userData] = utils.parseJSONtoObject(readMsg);
    if (userErr) {
        return callback(500, ApiResponse.error('Nepavyko nuskaityti duomenu'));
    }

    delete userData.hashedPassword;

    return callback(200, ApiResponse.success(userData));
}

// PUT (kapitalinis info pakeitimas)
// PATCH (vienos info dalies pakeitimas)
// Leidziam pasikeisti tik: fullname, pass -> hashedPassword
handler._innerMethods.put = async (data, callback) => {
    const { payload } = data;  //ka uploadina klientas
    const email = data.searchParams.get('email');

    const [emailErr, emailMsg] = IsValid.email(email);
    if (emailErr) {
        return callback(400, ApiResponse.error(emailMsg));
    }

    const [validErr, validMsg] = utils.objectValidator(payload, {
        optional: ['fullname', 'pass'],
    });

    if (validErr) {
        return callback(400, ApiResponse.error(validMsg));
    }

    const { fullname, pass } = payload;

    //console.log(fullname, pass);

    if (fullname) {
        const [fullnameErr, fullnameMsg] = IsValid.fullname(fullname);
        if (fullnameErr) {
            return callback(400, ApiResponse.error(fullnameMsg));
        }
    }

    if (pass) {
        const [passErr, passMsg] = IsValid.password(pass);
        if (passErr) {
            return callback(400, ApiResponse.error(passMsg));
        }
    }

    const [readErr, readMsg] = await file.read('accounts', email + '.json');
    if (readErr) {
        return callback(404, ApiResponse.error('Toks vartotojas neegzistouja, arba nepavyko gauti duomenu del teisiu trukumo'));
    }

    const [parseErr, userData] = utils.parseJSONtoObject(readMsg);
    if (parseErr) {
        return callback(500, ApiResponse.error('Nepavyko atnaujinti paskyros informacijos, del vidines serverio klaidos'));
    }

    if (fullname) {
        userData.fullname = fullname;
    }

    if (pass) {
        userData.pass = utils.hash(pass)[1];
    }


    const [updateErr] = await file.update('accounts', email + '.json', userData);

    if (updateErr) {
        return callback(500, ApiResponse.error('Nepavyko atnaujinti paskyros informacijos, del vidines serverio klaidos'));
    }

    return callback(200, ApiResponse.success('Vartotojo informacija sekmingai atnaujinta'));
}

// DELETE

handler._innerMethods.delete = async (data, callback) => {
    //1. Gauti emaila is nuorodos
    const email = data.searchParams.get('email');
    console.log(email);

    //2. Patikrinam ar tikrai gavom emaila

    const [emailErr, emailMsg] = IsValid.email(email);
    if (emailErr) {
        return callback(400, ApiResponse.error(emailMsg));
    }
    //3. Jei geras emailas tuomet trinam
    const [deleteErr] = await file.delete('accounts', email + '.json');

    if (deleteErr) {
        return callback(500, ApiResponse.error('Nepavyko istrinti paskyros informacijos, del vidines serverio klaidos'));
    }

    return callback(200, ApiResponse.success('Paskyra istrinta sekmingai'));
}

export default handler;