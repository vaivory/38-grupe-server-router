import { file } from "../lib/file.js";
import { IsValid } from "../lib/is-valid/IsValid.js";
import { utils } from "../lib/utils.js";
import config from "../config.js";
import { ApiResponse } from "../lib/ApiResponse.js";

//leidimas dirbti su privacia informacija kai login atliktas

const handler = {};

handler.token = async (data, callback) => {
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

// POST - sukuriame paskyra, isduodame prisijungima patvirtinanti token'a
handler._innerMethods.post = async (data, callback) => {
//1.Duomenu patikrinimas
 /*
    1) patikrinti, ar teisinga info (payload):
        - email
        - pass
        - fullname
        - isitikinti, jog atejusiame objekte nera kitu key's apart: email, fullname ir password
    */

        const { payload } = data;
        if (data.user.isLoggedIn) {
            return callback(200, ApiResponse.redirect('/'));
        }
    

        /*
        1) patikrinti, ar teisinga info (payload):
            - email
            - pass
            - isitikinti, jog atejusiame objekte nera kitu key's apart: email, fullname ir password
        */
    
        const [validErr, validMsg] = utils.objectValidator(payload, {
            required: ['email', 'pass'],
        });
    
        if (validErr) {
            return callback(400, ApiResponse.error(validMsg));
        }
    
        const { email, pass } = payload;
    
        const [emailErr, emailMsg] = IsValid.email(email);
        if (emailErr) {
            return callback(400, ApiResponse.error(emailMsg));
        }
    
        const [passErr, passMsg] = IsValid.password(pass);
        if (passErr) {
            return callback(400, ApiResponse.error(passMsg));
        }
    
        // 2. Patikrinti ar egzistuoja account
        const [readErr, readMsg] = await file.read('accounts', email + '.json');
    if (readErr) {
        return callback(400, ApiResponse.error('Vartotojas nerastas, arba neteisingas slaptazodis'));
    }

    const [parseErr, userObject] = utils.parseJSONtoObject(readMsg);
    if (parseErr) {
        return callback(500, ApiResponse.error('Nepavyko atlikti vartotojo informacijos paieskos'));
    }

    const [hashErr, hashedLoginPassword] = utils.hash(pass);
    if (hashErr) {
        return callback(500, ApiResponse.error('Nepavyko atlikti vartotojo informacijos paieskos'));
    }

    if (hashedLoginPassword !== userObject.hashedPassword) {
        return callback(400, ApiResponse.error('Vartotojas nerastas, arba neteisingas slaptazodis'));
    }

        // 3. Suteikti prieiga prie sistemos
        const randomToken = utils.randomString(config.sessionToken.length);

    const tokenObject = {
        email,
        hardDeadline: Math.floor(Date.now() / 1000) + config.sessionToken.hardDeadline,
    }

    const [createErr] = await file.create('token', randomToken + '.json', tokenObject);
    if (createErr) {
           return callback(500, ApiResponse.error('Nepavyko sukurti vartotojo sesijos'));
    }

    const cookies = [
        'login-token=' + randomToken,
        'path=/',
        'domain=localhost',
        'max-age=' + config.sessionToken.hardDeadline,
        'expires=Sun, 16 Jul 3567 06:23:41 GMT',
        // 'Secure',
        'SameSite=Lax',
        'HttpOnly',
    ];
    
    return callback(200, ApiResponse.redirect('/'), {
        'Set-Cookie': cookies.join('; '),
    });
}

// GET
handler._innerMethods.get = async (data, callback) => {



    return callback(200, {
        msgType: 'success',
        msg: 'Token informacija',
    }, {
        'Set-Cookie': cookies.join('; '),
    });
}

// PUT (kapitalinis info pakeitimas)

handler._innerMethods.put = async (data, callback) => {


    return callback(200, {
        msgType: 'success',
        msg: 'Token informacija sekmingai atnaujinta',
    });
}

// DELETE

handler._innerMethods.delete = async (data, callback) => {


    return callback(200, {
        msgType: 'success',
        msg: 'Token istrintas sekmingai',
    });
}

handler._innerMethods.verify = async (tokenStr) => {
    if (typeof tokenStr !== 'string' || tokenStr === '') {
        return false;
    }

    const [cookieErr, cookieMsg] = await file.read('token', tokenStr + '.json');
    if (cookieErr) {
        return false;
    }

    const [cookieParseErr, cookieParseMsg] = utils.parseJSONtoObject(cookieMsg);
    if (cookieParseErr) {
        return false;
    }

    const { hardDeadline } = cookieParseMsg;
    if (typeof hardDeadline !== 'number' || !isFinite(hardDeadline)) {
        return false;
    }

    return hardDeadline * 1000 >= Date.now();
}

export default handler;