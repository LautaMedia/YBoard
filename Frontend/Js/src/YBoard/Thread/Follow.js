import YQuery from '../../YQuery';
import YBoard from '../../YBoard';

class Follow
{
    add(id)
    {
        this.doAjax(id, '/api/thread/follow/add');
    }

    remove(id)
    {
        this.doAjax(id, '/api/thread/follow/remove');
    }

    markAllRead()
    {
        $('.icon-bookmark .unread-count').hide();
        $('h3 .notification-count').hide();
        $.post('/api/thread/follow/markallread').fail(function()
        {
            $('.icon-bookmark .unread-count').show();
            $('h3 .notification-count').show();
        });
    }

    toggleButton(id)
    {
        let button = YBoard.thread.getElm(id).find('.followbutton');

        if (button.hasClass('add')) {
            button.removeClass('icon-bookmark-add add').addClass('icon-bookmark-remove remove');
        } else {
            button.removeClass('icon-bookmark-remove remove').addClass('icon-bookmark-add add');
        }
    }

    doAjax(id, url)
    {
        this.toggleButton(id);
        YQuery.post(url, {'threadId': id}).fail(function()
        {
            YBoard.Thread.Follow.toggleButton(id);
        });
    }
}

export default Follow;
