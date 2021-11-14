Vue.component('vue-multiselect', window.VueMultiselect.default);

function gtag_report_conversion() {
    var callback = function () {};

    gtag('event', 'conversion', {
        'send_to': 'AW-928386230/Bq4eCOjdgccCELaZ2LoD',
        'event_callback': callback
    });
    
    return false;
}

async function send(uri, data, type = 'json') {

    const sendObject = {
        method: 'POST'
    };

    let contentType;

    switch (type) {
        case 'formData':
            sendObject.contentType = 'multipart/form-data';
            sendObject.body = data;
            break;
        case 'json':
            sendObject.headers = {
                'Content-Type': 'application/json; charset=utf-8'
            };
            sendObject.body = JSON.stringify(data);
            break;
    }

    console.log(`send to: ${uri}`, sendObject);

    const result = await fetch(uri, sendObject);
    let response = type === 'json' ? await result.json() : result;

    if (type === 'formData') {
        const reader = result.body.getReader();

        const stream = await new ReadableStream({
            start(controller) {
                function push() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        controller.enqueue(value);

                        push();
                    })
                }
                push();
            }
        });

        response = await new Response(stream, { headers: { "Content-Type": "text/html" } }).json();

    }
    console.log(`response from: ${uri}`, response);

    return response;
}

var appInst = new Vue({
    el: '#app',
    mounted: async function () {
        this.getCountriesList();
        this.present.first = localStorage.getItem('presentFirst');
        this.present.second = localStorage.getItem('presentSecond');
        this.present.fird = localStorage.getItem('presentFird');
        this.referId();
    },
    created() {
        window.addEventListener('scroll', this.showVisible);
        this.showVisible();
        this.cookies.visible = localStorage.getItem('cookies-policy');
    },
    data: {
        registration: {
            title: 'регистрация',
            buttonText: 'отправить код',
            button: 'Зарегистрироваться',
            codeFromPhone: null,
            requestId: null,
            phone: null,
            countryCode: {
                value: { code: '+7', country: 'Россия', countryCode: 'RU', _id: '60b536e37928e18618fb12e5' },
                options: [],
            },
            pass: null,
            pass2: null,
            name: null,
            email: null,
            steps: {
                count: 1,
            },
            complete: false,
            error: {
                phone: '',
                smsResponse: '',
                password: '',
                password2: '',
                nickname: '',
                email: '',
                captcha: '',
                confirmPass: '',
            },
            inputs: {
                phone: false,
                smsResponse: false,
                password: false,
                password2: false,
                nickname: false,
                email: false,
                captcha: false,
                lostpass: false,
            },
            bad: {
                phone: false,
                smsResponse: false,
                password: false,
                password2: false,
                nickname: false,
                email: false,
                captcha: false,
                confirmPass: false,
            },
            goodCode: false,
            goodId: null,
            goodLogin: null,
            wait: false,
            codeLimit: 4,
        },
        fadeOn: false,
        modals: {
            auth: {
                active: false,
                tab: 'registerblock'
            },
        },
        isActive: false,
        present: {
            first: false,
            second: false,
            fird: false,
            status: 'Получить',
            show: false,
        },
        captcha: {
            status: false,
            value: null,
        },
        cookies: {
            visible: false,
        },
        refId: null,
    },
    methods: {
        getCountriesList: async function () {
            const res = await send('https://wardgame.ru/index/getPhoneCodes');

            this.registration.countryCode.options = res.data;
        },
        acceptCookies: function () {
            this.cookies.visible = true;
            localStorage.setItem('cookies-policy', this.cookies.visible);
        },
        modalShow: function (modalName) {
            document.documentElement.style.overflow = 'hidden';

            appInst.modals[modalName].active = true;
            appInst.fadeOn = true;
        },
        modalHide: function (modalName) {
            if (modalName)
                this.modals[modalName].active = false;
            else
                Object.keys(this.modals).forEach((localModalName) => this.modals[localModalName].active = false);

            document.documentElement.style.overflow = 'auto';
            this.fadeOn = false;
        },
        registrationGo: async function (event) {
            if (event) {
                event.preventDefault();
                if (this.registration.steps.count == 1) {

                    await this.checkRegInputs();

                    if (this.registration.inputs.phone && this.registration.inputs.nickname && this.registration.inputs.password && this.registration.inputs.password2 && this.captcha.status) {

                        this.registration.wait = true;

                        const response = await send('https://wardgame.ru/profile/send_code', {
                            phone: this.registration.phone,
                            countryCode: this.registration.countryCode.value.countryCode,
                            requestType: 'registration',
                            captcha: this.captcha.value
                        });

                        if (response.status === 'OK') {
                            this.registration.requestId = response.data.requestId;
                            this.registration.wait = false;
                            this.nextStep('registration');
                        } else if (response.error === 'This phone already exists') {
                            this.registration.wait = false;
                            this.registration.error.phone = 'Данный номер уже зарегистрирован!';
                            this.registration.bad.phone = true;
                            this.registration.inputs.phone = false;
                            setTimeout(() => { this.registration.bad.phone = false }, 2000);
                        } else {
                            this.registration.wait = false;
                            response.error;
                            alert(response.error);
                        }
                    }
                } else if (this.registration.steps.count == 2) {

                    gtag_report_conversion();

                    if (!this.registration.requestId)
                        return alert('Произошла ошибка регистрации');

                    await this.checkCode();

                    this.registration.wait = true;

                    const response = await send('https://wardgame.ru/profile/linage_register', {
                        pass: this.registration.pass.toString(),
                        requestType: 'registration',
                        name: this.registration.name,
                        requestId: this.registration.requestId,
                        code: this.registration.codeFromPhone,
                        referId: this.refId,
                    });

                    if (response.status === 'OK') {
                        ym(81154345, 'reachGoal', 'yandexReg');

                        this.registration.wait = false;
                        localStorage.setItem('presentFirst', true);
                        localStorage.setItem('authToken', response.data.token);
                        this.present.first = localStorage.getItem('presentFirst');
                        this.registration.goodLogin = response.data.login;
                        this.nextStep('registration');
                    } else {
                        this.registration.wait = false;
                        this.registration.error.smsResponse = 'Неверный код подтверждения!';
                        this.registration.bad.smsResponse = true;
                        this.registration.inputs.smsResponse = false;
                        setTimeout(() => { this.registration.bad.smsResponse = false }, 2000);
                    }
                }
            }
        },
        nextStep(index) {
            this[index].steps.count++;
        },
        checkCode: async function () {
            this.registration.codeFromPhone && this.registration.codeFromPhone.length == 4
                ? this.registration.inputs.smsResponse = true
                : this.badRegInputsResponse('smsResponse', 'Неверный код подтверждения!')
        },
        checkRegInputs: async function () {
            const form = document.getElementById('form');
            const captcha = form.querySelector('[name="g-recaptcha-response"]');

            const form2 = document.getElementById('form2');
            const captcha2 = form2.querySelector('[name="g-recaptcha-response"]');

            this.captcha.value = captcha.value || captcha2.value;

            const checkPass = /[A-Za-z0-9]/.test(this.registration.pass);
            //const checkEmail = /^([a-z0-9_-]+\.)*[a-z0-9_-]+@[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,6}$/.test(this.registration.email);
            const checkName = /[A-Za-z0-9]/.test(this.registration.name);

            this.registration.phone && this.registration.phone.length >= 8
                ? this.registration.inputs.phone = true
                : this.badRegInputsResponse('phone', 'Неправильный формат телефона!')

            this.registration.pass && this.registration.pass.length >= 3 && checkPass
                ? this.registration.inputs.password = true
                : this.badRegInputsResponse('password', 'Пароль должен состоять только из латинских символов и цифр!')

            this.registration.pass2 && this.registration.inputs.password && (this.registration.pass == this.registration.pass2)
                ? this.registration.inputs.password2 = true
                : this.badRegInputsResponse('password2', 'Пароли должны совпадать!')

            this.registration.name && this.registration.name.length >= 3 && this.registration.name.length <= 16 && checkName
                ? this.registration.inputs.nickname = true
                : this.badRegInputsResponse('nickname', 'Неправильный формат логина!')

            this.captcha.value && this.captcha.value.length > 0
                ? this.captcha.status = true
                : this.badRegInputsResponse('captcha', 'Докажите, что вы не робот!')

            // this.registration.email && this.registration.email.length >= 5 && checkEmail
            //     ? this.registration.inputs.email = true
            //     : this.badRegInputsResponse('email', 'Неправильный формат почты!')
        },
        badRegInputsResponse: function (input, text) {
            this.registration.error[input] = text;
            this.registration.bad[input] = true;
            this.registration.inputs[input] = false;
            setTimeout(() => { this.registration.bad[input] = false }, 2000);
        },
        sendCode: function () {
            //const checkPhone = /[0-9]/.test(this.registration.phone);

            // if (
            //     (Number($cookies.get('sendCodeTime')) > 0 && Number($cookies.get('sendCodeTime')) + 30000 > Date.now()) ||
            //     !this.registration.phone ||
            //     this.registration.phone.length < 9 ||
            //     !checkPhone
            // ) {
            //     this.badRegInputsResponse('phone', 'Неправильный формат телефона!');
            //     return false;
            // }

            if (this.registration.codeFromPhone == 1559) {
                this.registration.goodCode = true;
                this.registration.bad.smsResponse = true;
                this.registration.error.smsResponse = 'Номер успешно подтвержден!';
            } else
                this.badRegInputsResponse('smsResponse', 'Неверный код!')

            // $cookies.set('sendCodeTime', Date.now());

            // alert('1559');

            // let timeout = 30;

            // this.registration.buttonText = `Повторно отправить через ${timeout} сек`;

            // function go() {
            //     setTimeout(() => {
            //         this.registration.buttonText = `Повторно отправить через ${--timeout} сек`;
            //         timeout > 0
            //             ? go.call(this)
            //             : this.registration.buttonText = 'Отправить код';
            //     }, 1000);
            // }
            // go.call(this);
        },
        presentFunc: function () {
            if (!this.present.first) {
                this.present.first = true;
            }
        },
        getBonus: function () {
            if (this.present.first == 'true' && this.present.second == 'true' && this.present.fird != 'true') {
                localStorage.setItem('presentFird', true);
                this.present.fird = localStorage.getItem('presentFird');
                this.present.text = 'Бонус успешно добавлен на ваш аккаунт!';
                this.present.show = true;
                setTimeout(() => { this.present.show = false }, 5000);
            }
        },
        downloadLauncher: function () {
            localStorage.setItem('presentSecond', true);
            this.present.second = localStorage.getItem('presentSecond');
            window.open('https://drive.google.com/file/d/1KHrgizyiB-wQ4W9xjVxWdlyat8MWbZDl');
        },
        isVisible: function (elem) {

            let coords = elem.getBoundingClientRect();

            let windowHeight = document.documentElement.clientHeight;

            let topVisible = coords.top < 100;

            return topVisible;
        },

        showVisible: async function () {
            for (let block of document.querySelectorAll("div#timer")) {
                if (this.isVisible(block)) {
                    $('.timer-header').fadeOut();
                    $('.telegram-block-trigger').fadeIn();
                } else {
                    $('.telegram-block-trigger').fadeOut();
                    $('.timer-header').fadeIn();
                }
            }
        },

        lostPassGo: async function (event) {
            if (event) {
                event.preventDefault();
                if (this.registration.steps.count === 1) {
                    this.registration.title = 'восстановление пароля';
                    this.registration.steps.count = 4;

                    this.registration.phone = null;
                    this.registration.name = null;
                    this.registration.codeFromPhone = null;
                    this.registration.pass = null;
                    this.registration.pass2 = null;
                    this.registration.goodId = null;
                } else if (this.registration.steps.count === 4) {
                    const form = document.getElementById('form3');
                    const captcha = form.querySelector('[name="g-recaptcha-response"]');

                    this.captcha.value = captcha.value;

                    this.registration.phone && this.registration.phone.length >= 8
                        ? this.registration.inputs.phone = true
                        : this.badRegInputsResponse('phone', 'Неправильный формат телефона!')

                    this.captcha.value && this.captcha.value.length > 0
                        ? this.captcha.status = true
                        : this.badRegInputsResponse('captcha', 'Докажите, что вы не робот!')

                    if (this.registration.inputs.phone && this.captcha.status) {

                        this.registration.wait = true;

                        const response = await send('https://wardgame.ru/profile/send_code', {
                            countryCode: this.registration.countryCode.value.countryCode,
                            captcha: this.captcha.value,
                            requestType: 'recovery',
                            phone: this.registration.phone,
                        });

                        if (response.status === 'OK') {
                            this.registration.requestId = response.data.requestId;
                            this.nextStep('registration');
                            this.registration.wait = false;
                        } else if (response.error == 'No Such User') {
                            this.badRegInputsResponse('phone', 'пользователя с таким номером нет!');
                            this.registration.wait = false;
                        } else {
                            response.error;
                            alert(response.error);
                            this.registration.wait = false;
                        }
                    }
                } else if (this.registration.steps.count === 5) {
                    const checkPass = /[A-Za-z0-9]/.test(this.registration.pass);

                    this.registration.pass && this.registration.pass.length >= 3 && checkPass
                        ? this.registration.inputs.password = true
                        : this.badRegInputsResponse('password', 'Пароль должен состоять только из латинских символов и цифр!')

                    this.registration.pass == this.registration.pass2
                        ? this.registration.inputs.lostpass = true
                        : this.badRegInputsResponse('confirmPass', 'Пароли должны совпадать!')

                    if (this.registration.inputs.password && this.registration.inputs.lostpass) {

                        this.registration.wait = true;

                        const response = await send('https://wardgame.ru/profile/pass_recovery', {
                            pass: this.registration.pass2,
                            code: this.registration.codeFromPhone,
                            requestType: 'recovery',
                            requestId: this.registration.requestId,
                        });

                        if (response.status === 'OK') {
                            this.registration.title = 'Пароль успешно изменен!';
                            this.nextStep('registration');
                            this.registration.wait = false;
                        } else {
                            this.registration.error.smsResponse = 'Неверный код подтверждения!';
                            this.registration.bad.smsResponse = true;
                            this.registration.inputs.smsResponse = false;
                            setTimeout(() => { this.registration.bad.smsResponse = false }, 2000);
                            this.registration.wait = false;
                        }

                    }
                }
            }
        },

        backToReg: function () {
            this.registration.title = 'регистрация';
            this.registration.steps.count = 1;
            this.registration.phone = null;
            this.registration.pass = null;
            this.registration.pass2 = null;
            this.registration.name = null;
        },

        referId: function () {
            const url = new URL(window.location.href);
            const filter = '?ref=';
            const check = url.href.includes(filter);

            if (check) {
                const sections = url.href.split('?ref=');
                const result = sections[1];
                
                this.refId = result;
            }
        },
    }
})