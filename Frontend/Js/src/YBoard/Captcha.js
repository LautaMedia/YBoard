// reCAPTCHA
import YBoard from '../YBoard';

class Captcha
{
    renderAll()
    {
        // Post form submit
        this.render(document.getElementById('post-form').querySelector('.g-recaptcha'), {
            'size': 'invisible',
            'callback': function(response) {
                window.captchaResponse = response;
                YBoard.PostForm.submit();
            },
            'badge': 'inline',
        });

        // Signup submit
        this.render(document.getElementById('signup').querySelector('.g-recaptcha'), {
            'size': 'invisible',
            'callback': function(response) {
                window.captchaResponse = response;
                YBoard.submitForm(null, document.getElementById('signup'));
            },
            'badge': 'inline',
        });
    }

    render(elm, options = {})
    {
        if (!this.isEnabled() || typeof grecaptcha === 'undefined' || !elm) {
            // Captcha not enabled, grecaptcha -library not loaded or captcha element not found
            return false;
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

export default Captcha;
