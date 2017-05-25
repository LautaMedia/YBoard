import Modal from '../Modal';
import YBoard from '../YBoard';
import YQuery from '../YQuery';

class Notifications
{
    constructor()
    {
        let that = this;

        document.querySelectorAll('.e-open-notifications').forEach(function(elm) {
            elm.addEventListener('click', function() {
                that.open();
            });
        });
    }

    open()
    {
        let postXhr = null;

        new Modal({
            'title': messages.notifications,
            'content': YBoard.spinnerHtml(),
            'onOpen': function(modal)
            {
                modal.elm.style.willChange = 'contents';
                postXhr = YQuery.post('/api/user/notification/getall', {}, {
                    'errorFunction': null,
                }).onLoad(function(xhr)
                {
                    if (modal.elm === null) {
                        return;
                    }
                    modal.setContent(xhr.responseText);
                    modal.elm.style.willChange = '';
                }).onError(function(xhr)
                {
                    if (xhr.responseText.length !== 0) {
                        let json = JSON.parse(xhr.responseText);
                        modal.setContent(json.message);
                    } else {
                        modal.setContent(messages.errorOccurred)
                    }
                });
                postXhr = postXhr.getXhrObject();
            },
            'onClose': function() {
                if (postXhr !== null && postXhr.readyState !== 4) {
                    postXhr.abort();
                }
            },
        });
    }

    markRead(id, e)
    {
        if (typeof e != 'undefined') {
            e.preventDefault();
        }

        $('#n-' + id).removeClass('not-read').addClass('is-read');
        $.post('/scripts/notifications/markread', {'id': id}).done(function()
        {
            if (typeof e != 'undefined') {
                window.location = e.target.getAttribute('href');
            }
        });

        this.updateUnreadCount($('.notification.not-read').length);
    }

    markAllRead()
    {
        $.post('/scripts/notifications/markallread');
        this.updateUnreadCount(0);
    }

    updateUnreadCount(count)
    {
        var elm = $('.unread-notifications');
        elm.html(parseInt(count));

        if (count == 0) {
            elm.addClass('none');
        } else {
            elm.removeClass('none');
        }
    }
}

export default Notifications;
