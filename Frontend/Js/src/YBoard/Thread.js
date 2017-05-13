import AutoUpdate from './Thread/AutoUpdate';
import Hide from './Thread/Hide';
import Follow from './Thread/Follow';

class Thread {
    constructor() {
        this.AutoUpdate = new AutoUpdate();
        this.Hide = new Hide();
        this.Follow = new Follow();
    }

    getElm(id)
    {
        return $('#thread-' + id);
    }

    toggleLock(id)
    {
        if (this.getElm(id).find('h3 a .icon-lock').length == 0) {
            $.post('/scripts/threads/lock', {'threadId': id}).done(function()
            {
                YB.thread.getElm(id).find('h3 a').prepend('<span class="icon-lock icon"></span>');
                toastr.success(messages.threadLocked);
            });
        } else {
            $.post('/scripts/threads/unlock', {'threadId': id}).done(function()
            {
                YB.thread.getElm(id).find('h3 a .icon-lock').remove();
                toastr.success(messages.threadUnlocked);
            });
        }
    }

    toggleSticky(id)
    {
        if (this.getElm(id).find('h3 a .icon-lock').length == 0) {
            $.post('/scripts/threads/stick', {'threadId': id}).done(function()
            {
                YB.thread.getElm(id).find('h3 a').prepend('<span class="icon-pushpin icon"></span>');
                toastr.success(messages.threadStickied);
            });
        } else {
            $.post('/scripts/threads/unstick', {'threadId': id}).done(function()
            {
                YB.thread.getElm(id).find('h3 a .icon-pushpin').remove();
                toastr.success(messages.threadUnstickied);
            });
        }
    }

    expand(threadId)
    {
        // Thread inline expansion
        var thread = this.getElm(threadId);
        if (!thread.hasClass('expanded')) {
            // Expand
            thread.addClass('expanded', true);

            var fromId = thread.find('.reply:first').attr('id').replace('post-', '');

            $.post('/scripts/threads/getreplies', {
                'threadId': threadId,
                'fromId': fromId,
            }).done(function(data)
            {
                // Update timestamps
                data = $(data);
                data.find('.datetime').localizeTimestamp(this);

                thread.find('.more-replies-container').html(data);
            });
        } else {
            // Contract
            thread.removeClass('expanded').find('.more-replies-container').html('');
        }
    }
}

export default Thread;
