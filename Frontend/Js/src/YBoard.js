import YQuery from './YQuery';
import Captcha from './YBoard/Captcha';

class YBoard {

    constructor() {
        if (this.isBadBrowser()) {
            this.browserWarning();
        }
    }

    isBadBrowser() {
        if (typeof FormData !== 'function') {
            return true;
        }

        if (typeof localStorage !== 'object') {
            return true;
        }

        return false;
    }

    browserWarning() {
        let browserWarning = document.createElement('div');
        browserWarning.classList.add('old-browser-warning');
        browserWarning.innerHTML = '<p>' + messages.oldBrowserWarning + '</p>';

        document.body.appendChild(browserWarning);
    }

    static pageReload() {
        window.location = window.location.href.split('#')[0];
    }

    static returnToBoard() {
        // Remove everything after the last slash and redirect
        // Should work if we are in a thread, otherwise not really
        let url = window.location.href;
        url = url.substr(0, url.lastIndexOf('/') + 1);

        window.location = url;
    }

    spinnerHtml(classes) {
        if (typeof classes === 'undefined') {
            classes = '';
        } else {
            classes += ' ';
        }

        return '<span class="' + classes + 'loading icon-loading spin"></span>';
    }

    submitForm(e) {
        e.preventDefault();

        if (!('FormData' in window)) {
            toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
            return false;
        }

        let form = $(e.target);
        let fd = new FormData(e.target);

        let overlay = $('<div class="form-overlay"><div>' + this.spinnerHtml() + '</div></div>');
        form.append(overlay);

        $.ajax({
            url: form.attr('action'),
            type: "POST",
            data: fd
        }).done(function (data) {
            if (data.reload) {
                if (data.url) {
                    window.location = data.url;
                } else {
                    window.location.reload();
                }
            } else {
                overlay.remove();
                toastr.success(data.message);
                form.reset();
            }
        }).fail(function () {
            overlay.remove();
        });
    }

    signup(elm, e) {
        // Signup form in sidebar
        e.preventDefault();
        elm = $(elm);

        Captcha.render('signup-captcha', {
            'size': 'invisible',
            'theme': 'dark'
        });

        let form = $('#login');
        let signupForm = $('#signup-form');

        if (typeof form.data('login') === 'undefined') {
            form.data('login', form.attr('action'));
        }

        if (!elm.data('open')) {
            form.attr('action', form.data('signup'));
            elm.html(messages.cancel);
            $('#loginbutton').val(messages.signUp);
            signupForm.slideDown();
            elm.data('open', true);
        } else {
            form.attr('action', form.data('login'));
            elm.html(messages.signUp);

            $('#loginbutton').val(messages.logIn);
            signupForm.slideUp();
            signupForm.find('input').val('');
            elm.data('open', false);
        }
    }
}

export default new YBoard();
