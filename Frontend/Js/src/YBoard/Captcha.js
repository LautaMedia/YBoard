// reCAPTCHA

class Captcha
{
    render(elm, options)
    {
        if (!this.isEnabled() || typeof grecaptcha === 'undefined' || !document.getElementById(elm)) {
            // Captcha not enabled, grecaptcha -library not loaded or captcha element not found
            return false;
        }

        if (!!document.getElementById(elm).innerHTML) {
            // If the captcha is already rendered
            return true;
        }

        options = Object.assign({'sitekey': config.reCaptchaPublicKey}, options);
        grecaptcha.render(elm, options);

        return true;
    }

    reset()
    {
        if (!this.isEnabled() || typeof grecaptcha === 'undefined') {
            // Captcha not enabled or grecaptcha -library not loaded
            return false;
        }

        grecaptcha.reset();

        return true;
    }

    isEnabled()
    {
        return typeof config.reCaptchaPublicKey !== 'undefined';
    }
}

export default new Captcha();
