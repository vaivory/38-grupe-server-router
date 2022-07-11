import { file } from "../lib/file.js";
import { IsValid } from "../lib/is-valid/IsValid.js";
import { utils } from "../lib/utils.js";
import config from "../config.js";

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

// POST - sukuriame paskyra
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
            return callback(400, {
                msg: validMsg,
            });
        }
    
        const { email, pass } = payload;
    
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
    
        // 2. Patikrinti ar egzistuoja account
        const [readErr, readMsg] = await file.read('accounts', email + '.json');
    if (readErr) {
        return callback(400, {
            msg: 'Vartotojas nerastas, arba neteisingas slaptazodis',
        });
    }

    const [parseErr, userObject] = utils.parseJSONtoObject(readMsg);
    if (parseErr) {
        return callback(500, {
            msg: 'Nepavyko atlikti vartotojo informacijos paieskos',
        });
    }

    const [hashErr, hashedLoginPassword] = utils.hash(pass);
    if (hashErr) {
        return callback(500, {
            msg: 'Nepavyko atlikti vartotojo informacijos paieskos',
        });
    }

    if (hashedLoginPassword !== userObject.hashedPassword) {
        return callback(400, {
            msg: 'Vartotojas nerastas, arba neteisingas slaptazodis',
        });
    }

        // 3. Suteikti prieiga prie sistemos
        const randomToken = utils.randomString(config.sessionTokenLength);
        console.log(randomToken);
    
    return callback(200, {
        msg: 'Token sukurtas sekmingai',
    });
}

// GET
handler._innerMethods.get = async (data, callback) => {



    return callback(200, {
        msg: 'Token informacija',
    });
}

// PUT (kapitalinis info pakeitimas)

handler._innerMethods.put = async (data, callback) => {


    return callback(200, {
        msg: 'Token informacija sekmingai atnaujinta',
    });
}

// DELETE

handler._innerMethods.delete = async (data, callback) => {


    return callback(200, {
        msg: 'Token istrintas sekmingai',
    });
}

export default handler;