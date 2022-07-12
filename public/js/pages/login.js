import { IsValid } from "../components/IsValid.js";

const formDOM = document.querySelector('.form');
const inputsDOM = formDOM.querySelectorAll('input');
const submitDOM = formDOM.querySelector('button');
const notificationsDOM = formDOM.querySelector('.notifications');

if (submitDOM) {
    submitDOM.addEventListener('click', async (e) => {
        e.preventDefault();

        notificationsDOM.classList.remove('show', 'success');

        const data = {};
        const errors = [];

        for (const inputDOM of inputsDOM) {
            const rule = inputDOM.dataset.validation;
            const [err, msg] = IsValid[rule](inputDOM.value);

            if (err) {
                errors.push(msg);
            } else {
                data[inputDOM.name] = inputDOM.value;
            }
        }

        if (errors.length) {
            notificationsDOM.classList.add('show');
            // notificationsDOM.innerHTML = errors.map(e => `<p>${e}.</p>`).join('');
            notificationsDOM.innerText = errors.join('.\n') + '.';
        } else {
            const response = await fetch(formDOM.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });
            const resBody = await response.json();

            notificationsDOM.innerText = resBody.msg;
            notificationsDOM.classList.add('show');

            console.log(response);

            if (response.ok) {
                notificationsDOM.classList.add('success');
            } else {
                notificationsDOM.classList.remove('success');
            }

        }
    })
}