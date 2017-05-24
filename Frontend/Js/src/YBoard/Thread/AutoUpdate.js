import YBoard from '../../YBoard';
import YQuery from '../../YQuery';
import Toast from '../../Toast';

class AutoUpdate
{
    constructor()
    {
        let that = this;
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

        document.querySelectorAll('.thread .e-get-replies').forEach(function(elm) {
            elm.addEventListener('click', function(e) {
                e.preventDefault();
                that.runOnce(elm.closest('.thread').dataset.id);
            });
        });
    }

    run(manual)
    {
        if (this.nowLoading) {
            return false;
        }

        this.nextLoadDelay = this.nextLoadDelay * (this.runCount === 0 ? 1 : this.runCount);
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

        let thread = YBoard.Thread.getElm(this.threadId);
        let fromId = thread.querySelector('.reply:last-of-type');
        if (fromId === null) {
            fromId = 0;
        } else {
            fromId = fromId.getAttribute('id').replace('post-', '');
        }

        this.nowLoading = true;
        let that = this;
        YQuery.post('/api/thread/getreplies', {
            'threadId': this.threadId,
            'fromId': fromId,
            'newest': true,
            'xhr': function(xhr) {
                xhr.responseType = 'document';

                return xhr;
            },
        }).onLoad(function(xhr)
        {
            if (manual && xhr.responseText.length === 0) {
                Toast.info(messages.noNewReplies);
                return;
            }

            let data = document.createElement('div');
            data.innerHTML = xhr.responseText;

            that.lastUpdateNewReplies = data.querySelectorAll('.post').length;
            that.newReplies += that.lastUpdateNewReplies;

            if (that.lastUpdateNewReplies === 0) {
                ++that.runCount;
            } else {
                that.runCount = 0;
            }

            YBoard.initElement(data);
            requestAnimationFrame(function() {
                thread.querySelector('.replies').appendChild(data);
            });

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
            if (!document.hasFocus() && that.newReplies > 0 && document.body.classList.contains('thread-page')) {
                document.title = '(' + that.newReplies + ') ' + that.originalDocTitle;
                let replies = document.querySelector('.replies');
                replies.querySelector('hr').remove();
                let hr = document.createElement('hr');
                replies.insertBefore(hr, replies.querySelector('.reply:eq(-' + that.newReplies + ')'));
            } else {
                if (that.newReplies !== 0) {
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
