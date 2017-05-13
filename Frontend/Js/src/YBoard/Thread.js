class Thread {
    getElm: function(id)
    {
        return $('#thread-' + id);
    },
    toggleLock: function(id)
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
    },
    toggleSticky: function(id)
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
    },
    expand: function(threadId)
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
    },
    hide: {
        add: function(id)
        {
            YB.thread.getElm(id).fadeToggle();
            $.post('/scripts/threads/hide', {'threadId': id}).done(function()
            {
                toastr.success(
                    messages.threadHidden + '<button class="link thread-restore" data-id="' + id + '">' + messages.undo + '</button>');
            }).fail(function()
            {
                YB.thread.getElm(id).stop().show();
            });
        },
        remove: function(id)
        {
            YB.thread.getElm(id).fadeToggle();
            $.post('/scripts/threads/restore', {'threadId': id}).done(function()
            {
                toastr.success(
                    messages.threadRestored + '<button class="link thread-hide" data-id="' + id + '">' + messages.undo + '</button>');
            }).fail(function()
            {
                YB.thread.getElm(id).stop().show();
            });
        },
    },
    follow: {
        add: function(id)
        {
            this.doAjax(id, '/scripts/follow/add');
        },
        remove: function(id)
        {
            this.doAjax(id, '/scripts/follow/remove');
        },
        markAllRead: function()
        {
            $('.icon-bookmark2 .unread-count').hide();
            $('h3 .notification-count').hide();
            $.post('/scripts/follow/markallread').fail(function()
            {
                $('.icon-bookmark2 .unread-count').show();
                $('h3 .notification-count').show();
            });
        },
        toggleButton: function(id)
        {
            var button = YB.thread.getElm(id).find('.followbutton');

            if (button.hasClass('add')) {
                button.removeClass('icon-bookmark-add add').addClass('icon-bookmark-remove remove');
            } else {
                button.removeClass('icon-bookmark-remove remove').addClass('icon-bookmark-add add');
            }
        },
        doAjax: function(id, url)
        {
            this.toggleButton(id);
            $.post(url, {'threadId': id}).fail(function()
            {
                YB.thread.follow.toggleButton(id);
            });
        },
    },
};

export default new Thread();
