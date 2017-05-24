import YQuery from './YQuery';
import Captcha from './YBoard/Captcha';
import Theme from './YBoard/Theme';
import Catalog from './YBoard/Catalog';
import Thread from './YBoard/Thread';
import Post from './YBoard/Post';
import PostForm from './YBoard/PostForm';
import Tooltip from './Tooltip';
import Toast from './Toast';

class YBoard
{
    constructor()
    {
        let that = this;
        this.Catalog = new Catalog();
        this.Captcha = new Captcha();
        this.Theme = new Theme();
        this.Thread = new Thread();
        this.Post = new Post();
        this.PostForm = new PostForm();

        if (this.isBadBrowser()) {
            this.browserWarning();
        }

        document.addEventListener('keydown', function(e)
        {
            if (!e.ctrlKey && !e.shiftKey && e.which === 116 || e.ctrlKey && !e.shiftKey && e.which === 82) {
                // Make F5 || CTRL + R function like clicking links and thus not reloading everything
                // Maybe we can remove this completely one day.
                e.preventDefault();
                that.pageReload();
            }
            if (e.ctrlKey && e.which === 13) {
                // Submit the post form with CTRL + Enter
                that.PostForm.submit(e);
            }
        });

        YQuery.on('submit', 'form.ajax', function (event) {
            that.submitForm(event);
        });

        // Sidebar signup & login
        let loginForm = document.getElementById('login');
        if (loginForm !== null) {
            loginForm.querySelector('.e-signup').addEventListener('click', function(e)
            {
                that.signup(e, true);
            });
            document.getElementById('signup').querySelector('.cancel').addEventListener('click', function(e)
            {
                that.signup(e, false);
            });
        }

        // Hide sidebar
        document.getElementById('e-sidebar-hide').addEventListener('click', function()
        {
            that.Theme.toggleSidebar();
        });

        // Go to top
        document.getElementById('scroll-to-top').addEventListener('click', function()
        {
            window.scrollTo(0, 0);
        });

        // Go to bottom
        document.getElementById('scroll-to-bottom').addEventListener('click', function()
        {
            window.scrollTo(0, document.body.scrollHeight);
        });

        // Reload page
        document.getElementById('reload-page').addEventListener('click', function()
        {
            that.pageReload()
        });

        this.initElement(document);
    }

    initElement(elm)
    {
        let that = this;

        // Performance gains are huge (like 98%), if "elm" is not a document fragment.
        // So let's take the advantage of that for the initial page load.
        let tooltips;
        if (typeof elm.getElementsByClassName === 'function') {
            // Localize dates, numbers and currencies
            [].forEach.call(elm.getElementsByClassName('datetime'), this.localizeDatetime);
            [].forEach.call(elm.getElementsByClassName('number'), this.localizeNumber);
            [].forEach.call(elm.getElementsByClassName('currency'), this.localizeCurrency);

            tooltips = Array.prototype.concat.apply([], elm.getElementsByClassName("tip"));
            tooltips = Array.prototype.concat.apply(tooltips, elm.getElementsByClassName("ref"));
        } else {
            elm.querySelectorAll('.datetime').forEach(this.localizeDatetime);
            elm.querySelectorAll('.number').forEach(this.localizeNumber);
            elm.querySelectorAll('.currency').forEach(this.localizeCurrency);

            tooltips = elm.querySelectorAll('.tip, .ref');
        }

        this.PostForm.bindPostEvents(elm);
        this.Post.truncateLongPosts(elm);
        this.Post.bindEvents(elm);

        tooltips.forEach(function(elm)
        {
            elm.addEventListener('mouseover', function(e)
            {
                let postId = null;
                if (typeof e.target.dataset.id !== 'undefined') {
                    postId = e.target.dataset.id;
                }
                let postXhr = null;
                new Tooltip(e, {
                    'openDelay': 100,
                    'position': 'bottom',
                    'content': that.spinnerHtml(),
                    'onOpen': function(tip)
                    {
                        postXhr = YQuery.post('/api/post/get', {
                            'postId': postId,
                        }, {
                            'errorFunction': null,
                        }).onLoad(function(xhr)
                        {
                            if (tip.elm === null) {
                                return;
                            }
                            tip.setContent(xhr.responseText);
                            tip.position();

                            let referringId = e.target.closest('.post').dataset.id;
                            if (tip.elm.querySelectorAll('.ref').length > 1) {
                                let referring = tip.elm.querySelector('.ref[data-id="' + referringId + '"]');
                                if (referring !== null) {
                                    referring.classList.add('referring');
                                }
                            }
                        }).onError(function(xhr)
                        {
                            if (xhr.responseText.length !== 0) {
                                let json = JSON.parse(xhr.responseText);
                                tip.setContent(json.message);
                            } else {
                                tip.setContent(messages.errorOccurred)
                            }
                            tip.position();
                        });
                        postXhr = postXhr.getXhrObject();
                    },
                    'onClose': function() {
                        if (postXhr !== null && postXhr.readyState !== 4) {
                            postXhr.abort();
                        }
                    },
                });
            });
        });
    }

    localizeDatetime(elm)
    {
        elm.innerHTML =  new Date(elm.innerHTML.replace(' ', 'T') + 'Z').toLocaleString();
    }

    localizeNumber(elm)
    {
        elm.innerHTML = parseFloat(elm.innerHTML).toLocaleString(undefined, {
            minimumFractionDigits: 0
        });
    }

    localizeCurrency(elm, currency = 'eur')
    {
        // I think this is a bug with Babel?
        if (currency === 0) {
            currency = 'eur';
        }

        elm.innerHTML = parseFloat(elm.innerHTML).toLocaleString(undefined, {
            'style': 'currency',
            'currency': currency
        });
    }

    getSelectionText()
    {
        let text = '';
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else {
            if (document.selection && document.selection.type !== 'Control') {
                text = document.selection.createRange().text;
            }
        }

        return text;
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

    pageReload()
    {
        window.location = window.location.href.split('#')[0];
    }

    returnToBoard()
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

    submitForm(e, form = false)
    {
        let that = this;

        if (e !== null) {
            e.preventDefault();
            form = e.target;
        }

        if (form === false) {
            return false;
        }

        let fd = new FormData(form);

        let overlay = document.createElement('div');
        overlay.classList.add('form-overlay');
        overlay.innerHTML = '<div>' + this.spinnerHtml() + '</div></div>';
        form.appendChild(overlay);

        YQuery.post(form.getAttribute('action'), fd).onLoad(function(xhr)
        {
            let data = JSON.parse(xhr.responseText);
            if (data.reload) {
                if (data.url) {
                    window.location = data.url;
                } else {
                    window.location.reload();
                }
            } else {
                overlay.remove();
                Toast.success(data.message);
                form.reset();
            }
        }).onError(function(xhr)
        {
            overlay.remove();
        });
    }

    signup(e, show)
    {
        let that = this;
        // Signup form in sidebar
        e.preventDefault();
        let elm = e.target;

        let loginForm = document.getElementById('login');
        let signupForm = document.getElementById('signup');

        if (show) {
            signupForm.show('flex');
            loginForm.hide();

            this.Captcha.render(signupForm.querySelector('.g-recaptcha'), {
                'size': 'invisible',
                'callback': function(response)
                {
                    that.submitForm(null, signupForm);
                }
            });
        } else {
            signupForm.hide();
            loginForm.show('flex');
        }
    }
}

export default new YBoard();
