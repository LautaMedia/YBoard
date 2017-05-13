class AutoUpdate
{
    constructor()
    {
        this.threadId = false;
        this.nextLoadDelay = 2000;
        this.newReplies = 0;
        this.lastUpdateNewReplies = 0;
        this.runCount = 0;
        this.nowLoading = false;
        this.isActive = false;
        this.nextRunTimeout = 0;
        this.startDelayTimeout = 0;
        this.originalDocTitle = document.title;
    }

    run(manual)
    {
        if (this.nowLoading) {
            return false;
        }

        this.nextLoadDelay = this.nextLoadDelay * (this.runCount == 0 ? 1 : this.runCount);
        if (this.nextLoadDelay > 30000) {
            this.nextLoadDelay = 30000;
        }

        // Limit
        if (this.runCount > 40) {
            this.stop();
        }

        if (manual) {
            this.runCount = 0;
            if (this.isActive) {
                this.restart();
            }
        }

        let thread = YB.thread.getElm(this.threadId);
        let fromId = thread.find('.reply:last').attr('id');
        if (typeof fromId === 'undefined') {
            fromId = 0;
        } else {
            fromId = fromId.replace('post-', '');
        }

        this.nowLoading = true;
        let that = this;
        YQuery.post('/scripts/threads/getreplies', {
            'threadId': this.threadId,
            'fromId': fromId,
            'newest': true,
        }).onLoad(function(data)
        {
            if (manual && data.length == 0) {
                YBoard.Toast.info(messages.noNewReplies);
            }
            // Update timestamps
            data = $(data);
            data.find('.datetime').localizeTimestamp(this);

            that.lastUpdateNewReplies = data.find('.message').length;
            that.newReplies += that.lastUpdateNewReplies;

            if (that.lastUpdateNewReplies == 0) {
                ++that.runCount;
            } else {
                that.runCount = 0;
            }

            data.appendTo(thread.find('.replies'));

            // Run again
            if (!manual) {
                that.nextRunTimeout = setTimeout(function()
                {
                    that.start();
                }, that.nextLoadDelay);
            }
        }).onError(function()
        {
            that.stop();
        }).onEnd(function()
        {
            that.nowLoading = false;

            // Notify about new posts on title
            if (!document.hasFocus() && that.newReplies > 0 && $('body').hasClass('thread-page')) {
                document.title = '(' + that.newReplies + ') ' + that.originalDocTitle;
                var replies = $('.replies');
                replies.find('hr').remove();
                replies.find('.reply:eq(-' + that.newReplies + ')').before('<hr>');
            } else {
                if (self.newReplies != 0) {
                    that.newReplies = 0;
                }
            }
        });
    }

    runOnce(thread)
    {
        this.threadId = thread;
        this.run(true);
    }

    start()
    {
        this.isActive = true;
        if (this.startDelayTimeout) {
            clearTimeout(this.startDelayTimeout);
        }

        let that = this;
        this.threadId = $('.thread:first').data('id');
        this.startDelayTimeout = setTimeout(function()
        {
            that.run(false);
        }, 1000);

        return true;
    }

    stop()
    {
        if (!this.isActive) {
            return true;
        }

        if (this.startDelayTimeout) {
            clearTimeout(this.startDelayTimeout);
        }
        this.isActive = false;

        this.reset();
        return true;
    }

    restart()
    {
        this.stop();
        this.start();
    }

    reset()
    {
        this.nowLoading = false;
        this.newReplies = 0;
        this.runCount = 0;
        if (document.title !== this.originalDocTitle) {
            document.title = this.originalDocTitle;
        }

        if (this.nextRunTimeout) {
            clearTimeout(this.nextRunTimeout);
        }
    }
}

export default AutoUpdate;
