import YQuery from './YQuery';
import Captcha from './YBoard/Captcha';
import Theme from './YBoard/Theme';
import Toast from './YBoard/Toast';
import Catalog from './YBoard/Catalog';
import Thread from './YBoard/Thread';
import Post from './YBoard/Post';
import PostForm from './YBoard/PostForm';

class YBoard
{
    constructor()
    {
        this.Catalog = new Catalog();
        this.Captcha = new Captcha();
        this.Theme = new Theme();
        this.Toast = new Toast();
        this.Thread = new Thread();
        this.Post = new Post();
        this.PostForm = new PostForm();

        if (this.isBadBrowser()) {
            this.browserWarning();
        }
    }

    isBadBrowser()
    {
        if (typeof FormData !== 'function') {
            return true;
        }

        if (typeof localStorage !== 'object') {
            return true;
        }

        return false;
    }

    browserWarning()
    {
        let browserWarning = document.createElement('div');
        browserWarning.classList.add('old-browser-warning');
        browserWarning.innerHTML = '<p>' + messages.oldBrowserWarning + '</p>';

        document.body.appendChild(browserWarning);
    }

    static pageReload()
    {
        window.location = window.location.href.split('#')[0];
    }

    static returnToBoard()
    {
        // Remove everything after the last slash and redirect
        // Should work if we are in a thread, otherwise not really
        let url = window.location.href;
        url = url.substr(0, url.lastIndexOf('/') + 1);

        window.location = url;
    }

    spinnerHtml(classes = '')
    {
        if (classes !== '') {
            classes += ' ';
        }

        return '<span class="' + classes + 'loading icon-loading spin"></span>';
    }

    submitForm(e)
    {
        e.preventDefault();

        let form = $(e.target);
        let fd = new FormData(e.target);

        let overlay = $('<div class="form-overlay"><div>' + this.spinnerHtml() + '</div></div>');
        form.append(overlay);

        YQuery.post(form.getAttribute('action'), fd).done(function(data) {
            if (data.reload) {
                if (data.url) {
                    window.location = data.url;
                } else {
                    window.location.reload();
                }
            } else {
                overlay.remove();
                this.Toast.success(data.message);
                form.reset();
            }
        }).fail(function()
        {
            overlay.remove();
        });
    }

    signup(elm, e)
    {
        // Signup form in sidebar
        e.preventDefault();
        elm = $(elm);

        this.Captcha.render('signup-captcha', {
            'size': 'invisible',
            'theme': 'dark',
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
