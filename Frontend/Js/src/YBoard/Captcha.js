class Captcha
{
    render(elm, options = {})
    {
        if (!this.isEnabled() || typeof grecaptcha === 'undefined' || !elm || !!elm.dataset.rendered) {
            // Captcha not enabled, grecaptcha -library not loaded, captcha element not found or already rendered
            return false;
        }

        elm.dataset.rendered = true;

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

export default Captcha;
