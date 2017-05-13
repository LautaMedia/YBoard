class Notifications
{
    constructor()
    {
        let button = document.getElementById('notifications-button');
        if (button) {
            button.addEventListener('click', function() {
                this.open();
            });
        }

    }

    open()
    {
        YBoard.Modal.open('/scripts/notifications/get', {
            'onAjaxComplete': function()
            {
                this.updateUnreadCount($('.notifications-list .not-read').length);
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
