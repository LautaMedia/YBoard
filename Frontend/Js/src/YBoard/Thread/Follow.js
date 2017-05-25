import YQuery from '../../YQuery';

class Follow
{
    constructor()
    {
        let that = this;

        document.querySelectorAll('.e-thread-follow').forEach(function(elm)
        {
            elm.addEventListener('click', that.toggle);
        });

        document.querySelectorAll('.e-follow-mark-read').forEach(function(elm)
        {
            elm.addEventListener('click', that.markAllRead);
        });
    }

    markAllRead()
    {
        document.querySelectorAll('.icon-bookmark .unread-count').forEach(function(elm) {
            elm.hide();
        });
        document.querySelectorAll('h3 .notification-count').forEach(function(elm) {
            elm.hide();
        });

        YQuery.post('/api/user/thread/follow/markallread').onError(function()
        {
            document.querySelectorAll('.icon-bookmark .unread-count').forEach(function(elm) {
                elm.show();
            });
            document.querySelectorAll('h3 .notification-count').forEach(function(elm) {
                elm.show();
            });
        });
    }

    toggle(e)
    {
        let thread = e.target.closest('.thread, .post');
        let button = e.currentTarget;

        let create = true;
        if (e.currentTarget.classList.contains('act')) {
            create = false;
        }
        thread.classList.toggle('followed');

        toggleButton(button);

        YQuery.post(create ? '/api/user/thread/follow/create' : '/api/user/thread/follow/delete',
            {'threadId': thread.dataset.id}).onError(function(xhr)
        {
            thread.classList.toggle('followed');
            toggleButton(button);
        });

        function toggleButton(elm)
        {
            if (!elm.classList.contains('act')) {
                elm.classList.add('icon-bookmark-remove', 'act');
                elm.classList.remove('icon-bookmark-add');
            } else {
                elm.classList.add('icon-bookmark-add');
                elm.classList.remove('icon-bookmark-remove', 'act');
            }
        }
    }
}

export default Follow;
