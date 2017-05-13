import YQuery from '../../YQuery';
import YBoard from '../../YBoard';

class File
{
    constructor()
    {
        // Video volume change
        document.addEventListener('volumechange', function() {
            localStorage.setItem('videoVolume', this.volume);
        });
    }

    delete(id)
    {
        if (!confirm(messages.confirmDeleteFile)) {
            return false;
        }

        YQuery.post('/scripts/posts/deletefile', {
            'post_id': id,
            'loadFunction': function()
            {
                this.getElm(id).find('figure').remove();
                YBoard.Toast.success(messages.fileDeleted);
            },
        });
    }

    expand(elm)
    {
        var img = $(elm).find('img');
        elm.parent('.message').addClass('full');

        img.data('orig-src', img.attr('src'));
        this.changeSrc(img, elm.find('figcaption a').attr('href'));
        elm.removeClass('thumbnail');
    }

    restoreThumbnail(elm)
    {
        var img = $(elm).find('img');

        this.changeSrc(img, img.data('orig-src'));
        elm.addClass('thumbnail');

        // Scroll to top of image
        var elmTop = elm.offset().top;
        if ($(document).scrollTop() > elmTop) {
            $(document).scrollTop(elmTop);
        }
    }

    changeSrc(img, src)
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
    }

    playMedia(elm)
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

            var volume = localStorage.getItem('videoVolume');
            if (volume !== null) {
                elm.find('video').prop('volume', volume);
            }
        }).always(function()
        {
            clearTimeout(loading);
            elm.find('div.overlay').remove();
            elm.removeData('loading');
        });
    }

    stopAllMedia()
    {
        $('.media-player-container').each(function()
        {
            var self = $(this);
            var mediaPlayer = self.find('.media-player');

            mediaPlayer.find('video').trigger('pause');
            mediaPlayer.remove();

            self.removeClass('media-player-container').addClass('thumbnail');
        });
    }
}

export default File;
