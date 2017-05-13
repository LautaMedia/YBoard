import YQuery from '../YQuery';
import YBoard from '../YBoard';

class Post
{
    getElm(id)
    {
        return document.getElementById('post-' + id);
    };

    delete(id)
    {
        if (!confirm(messages.confirmDeletePost)) {
            return false;
        }

        let that = this;
        YQuery.post('/scripts/posts/delete', {
            'postId': id,
            'loadFunction': function()
            {
                that.getElm(id).remove();
                if ($('body').hasClass('thread-page')) {
                    if (YB.thread.getElm(id).is('*')) {
                        // We're in the thread we just deleted
                        YB.returnToBoard();
                    }
                } else {
                    // The deleted post is not the current thread
                    YBoard.thread.getElm(id).remove();
                    toastr.success(messages.postDeleted);
                }
            },
        });
    }

    highlight(id)
    {
        this.getElm(id).classList.add('highlighted');
    }

,
    removeHighlights:

    ;function()
    {
        var elems = document.getElementsByClassName('highlighted');
        while (elems.length) {
            elems[0].classList.remove('highlighted');
        }
    }
}
;// -------------------------------------------
YB.post.file = {
    delete: function(id)
    {
        if (!confirm(messages.confirmDeleteFile)) {
            return false;
        }

        $.post('/scripts/posts/deletefile', {'post_id': id}).done(function()
        {
            this.getElm(id).find('figure').remove();
            toastr.success(messages.fileDeleted);
        });
    },

    // Expand images
    // -------------------------------------------
    expand: function(elm)
    {
        var img = $(elm).find('img');
        elm.parent('.message').addClass('full');

        img.data('orig-src', img.attr('src'));
        this.changeSrc(img, elm.find('figcaption a').attr('href'));
        elm.removeClass('thumbnail');
    },
    restoreThumbnail: function(elm)
    {
        var img = $(elm).find('img');

        this.changeSrc(img, img.data('orig-src'));
        elm.addClass('thumbnail');

        // Scroll to top of image
        var elmTop = elm.offset().top;
        if ($(document).scrollTop() > elmTop) {
            $(document).scrollTop(elmTop);
        }
    },
    changeSrc: function(img, src)
    {
        img.data('expanding', 'true');
        var loading = setTimeout(function()
        {
            img.after('<div class="overlay center">' + YB.spinnerHtml() + '</div>');
        }, 200);
        img.attr('src', src).on('load', function()
        {
            img.removeData('expanding');
            clearTimeout(loading);
            img.next('div.overlay').remove();
        });
    },

    // Media player
    // -------------------------------------------
    playMedia: function(elm)
    {
        this.stopAllMedia();

        var post = elm.parent('.message');
        var img = elm.find('img');

        var fileId = elm.data('id');

        if (typeof elm.data('loading') != 'undefined') {
            return false;
        }

        elm.data('loading', 'true');

        var loading = setTimeout(function()
        {
            img.after('<div class="overlay bottom left">' + YB.spinnerHtml() + '</div>');
        }, 200);

        $.post('/scripts/files/getmediaplayer', {'fileId': fileId}).done(function(data)
        {
            elm.removeClass('thumbnail').addClass('media-player-container');
            post.addClass('full');
            elm.prepend(data);

            var volume = YB.localStorage.get('videoVolume');
            if (volume != null) {
                elm.find('video').prop('volume', volume);
            }
        }).always(function()
        {
            clearTimeout(loading);
            elm.find('div.overlay').remove();
            elm.removeData('loading');
        });
    },
    stopAllMedia: function()
    {
        $('.media-player-container').each(function()
        {
            var self = $(this);
            var mediaPlayer = self.find('.media-player');

            mediaPlayer.find('video').trigger('pause');
            mediaPlayer.remove();

            self.removeClass('media-player-container').addClass('thumbnail');
        });
    },
    saveVolume: function(elm)
    {
        YB.localStorage.store('videoVolume', $(elm).prop('volume'));
    },
};

// Reporting
// -------------------------------------------
YB.post.report = {
    openForm: function()
    {
        YB.modal.open('/scripts/report/getform', {
            'onAjaxComplete': function()
            {
                YB.captcha.render('report-captcha');
                $('#report-post-id').val(id);
            },
        });
    },
    submit: function(event)
    {
        event.preventDefault();

        if (!('FormData' in window)) {
            toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
            return false;
        }

        var form = $(event.target);
        var fd = new FormData(event.target);

        var oldHtml = $(event.target).html();
        $(event.target).html(YB.spinnerHtml());

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            processData: false,
            contentType: false,
            data: fd,
        }).done(function()
        {
            toastr.success(messages.postReported);
            YB.modal.closeAll();
        }).fail(function(xhr)
        {
            if (xhr.status == '418') {
                YB.modal.closeAll();
            } else {
                $(event.target).html(oldHtml);
            }
        });
    },
    setChecked: function(postId)
    {
        $.post('/scripts/mod/reports/setchecked', {'postId': postId}).done(function()
        {
            toastr.success(messages.reportCleared);
            YB.post.getElm(postId).remove();
        });
    },
};
}
