class Modal
{
    open(url, options)
    {
        this.$body = $('body');
        this.$blocker = null;

        // Default options
        this.options = $.extend({
            closeExisting: true,
            postData: {},
            onAjaxComplete: function()
            {
            },
        }, options);

        // Close any open modals.
        if (this.options.closeExisting) {
            $('.modal-container').remove();
        }

        // Open blocker
        this.$body.css('overflow', 'hidden');
        $('.modal-container.current').removeClass('current');
        this.$blocker = $('<div class="modal-container current"></div>').appendTo(this.$body);

        // Bind close event
        $(document).off('keydown.modal').on('keydown.modal', function(e)
        {
            if (e.which == 27) {
                this.close();
            }
        });
        this.$blocker.click(function(e)
        {
            if (e.target == this) {
                this.close();
            }
        });

        this.$container = $(
            '<div class="modal"><button class="modal-close"><span class="icon-cross2"></span></button></div>');
        this.$blocker.append(this.$container);
        this.$elm = $('<div class="modal-content"></div>');
        this.$container.append(this.$elm);
        this.$elm.html('<div class="modal-loading">' + YB.spinnerHtml() + '</div>');

        var current = this.$elm;
        $.ajax({
            url: url,
            type: 'POST',
            data: options.postData,
        }).done(function(html)
        {
            current.html(html);
        }).fail(function()
        {
            YB.modal.close();
        });
    }

    close()
    {
        $('.modal-container:last').remove();
        $('.modal-container:last').addClass('current');

        if ($('.modal-container').length == 0) {
            $('body').css('overflow', '');
        }
    }

    closeAll()
    {
        $('.modal-container').remove();
        $('body').css('overflow', '');
    }
}

export default Modal;
