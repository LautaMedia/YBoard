// reCAPTCHA

export default {
    render: function (elm, options) {
        options = Object.assign({'sitekey': config.reCaptchaPublicKey}, options);

        if (typeof grecaptcha === 'undefined' || !document.getElementById(elm)) {
            return false;
        }

        if (!!document.getElementById(elm).innerHTML) {
            return true;
        }
        grecaptcha.render(elm, options);
    },
    reset: function () {
        if (typeof grecaptcha === 'undefined') {
            return true;
        }

        grecaptcha.reset();
    }
};
