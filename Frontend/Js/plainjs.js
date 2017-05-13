/*
// -------------------------------------------
// Post moderation
// -------------------------------------------
/*
$('.mod-menu').tooltipster({
    content: YB.spinnerHtml(),
    side: 'bottom',
    animationDuration: 0,
    updateAnimation: null,
    delay: 0,
    arrow: false,
    contentAsHTML: true,
    zIndex: 1001,
    trigger: 'click',
    interactive: 'true',
    functionInit: function (instance, helper) {
        var content = $(helper.origin).next('.mod-menu-html').show().detach();
        instance.content(content);
    }
});
*/

function addBan(e) {
    e.preventDefault();

    if (!('FormData' in window)) {
        toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
        return false;
    }

    var fd = new FormData(e.target);

    var oldHtml = $(e.target).html();
    $(e.target).html(YB.spinnerHtml());

    $.ajax({
        url: e.target.getAttribute('target'),
        type: "POST",
        processData: false,
        contentType: false,
        data: fd
    }).done(function () {
        toastr.success(messages.banAdded);
        closeModals();
    }).fail(function () {
        $(e.target).html(oldHtml);
    });
}

/*
if ($('body').hasClass('thread-page')) {
    $(window)
        .on('scroll', function () {
            var windowBottom = $(window).height() + $(window).scrollTop();
            var repliesBottom = $('.replies').offset().top + $('.replies').height();
            if (windowBottom > repliesBottom) {
                if (!$('#post-message').is(':focus')) {
                    YB.thread.ajaxUpdate.start();
                }
            } else {
                YB.thread.ajaxUpdate.stop();
            }
        })
        .on('focus', function () {
            YB.thread.ajaxUpdate.reset();
        });
    // Stop when post form is focused
    $('body')
        .on('focus', '#post-message', function () {
            YB.thread.ajaxUpdate.stop();
        })
        .on('blur', '#post-message', function () {
            YB.thread.ajaxUpdate.start();
        });
}
*/

// -------------------------------------------
// Spoilers & reflinks
// -------------------------------------------
var reflinkCreateTimeout;
yQuery
    .on('touchstart', '.spoiler:not(.spoiled)', function (e) {
        e.preventDefault();
        e.target.addClass('spoiled');
    })
    .on('click', false, function (e) {
        document.querySelectorAll('.spoiler.spoiled').forEach(function(elm) {
            elm.removeClass('spoiled');
        });
    })
    .on('contextmenu', '.reflink', function (e) {
        e.preventDefault();
    })
    /*
    .on('touchstart mouseenter', '.reflink:not(.tooltipstered)', function (e) {
        var elm = $(this);
        reflinkCreateTimeout = setTimeout(function () {
            e.preventDefault();
            var id = elm.data('id');
            var content = YB.spinnerHtml();
            if (YB.post.getElm(id) != null) {
                content = YB.post.getElm(id).innerHTML;
            }

            elm.tooltipster({
                content: content,
                side: 'bottom',
                animationDuration: 0,
                updateAnimation: null,
                delay: 0,
                arrow: false,
                contentAsHTML: true,
                theme: 'thread',
                trigger: 'custom',
                triggerOpen: {
                    mouseenter: true,
                    touchstart: true
                },
                triggerClose: {
                    mouseleave: true,
                    click: true
                },
                functionInit: function (instance, helper) {
                    var id = $(helper.origin).data('id');
                    $.post('/scripts/posts/get', {'postId': id}).done(function (data) {
                        // Update timestamps
                        data = $(data);
                        data.find('.datetime').localizeTimestamp(this);

                        instance.content(data);
                    }).fail(function () {
                        instance.close();
                    });
                }
            }).tooltipster('open');
        }, 100);
    })
    .on('touchend mouseleave', '.reflink:not(.tooltipstered)', function (e) {
        clearTimeout(reflinkCreateTimeout);
    })
    .on('click', ':not(.tooltipster-base) .reflink', function (e) {
        var id = $(this).data('id');
        if (YB.post.getElm(id) != null) {
            e.preventDefault();
            window.location = window.location.href.split('#')[0] + '#post-' + id;
        }

    });
    */

// -------------------------------------------
// Basic tooltips
// -------------------------------------------
/*$('.tooltip').tooltipster({
    side: 'bottom',
    animationDuration: 0,
    delay: 0,
    trigger: 'click'
});*/

// -------------------------------------------
// Catalog functions
// -------------------------------------------

// -------------------------------------------
// Modals
// -------------------------------------------
YB.modal = {
    open: function (url, options) {
        this.$body = $('body');
        this.$blocker = null;

        // Default options
        this.options = $.extend({
            closeExisting: true,
            postData: {},
            onAjaxComplete: function () {
            }
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
        $(document).off('keydown.modal').on('keydown.modal', function (e) {
            if (e.which == 27) {
                YB.modal.close();
            }
        });
        this.$blocker.click(function (e) {
            if (e.target == this) {
                YB.modal.close();
            }
        });

        this.$container = $('<div class="modal"><button class="modal-close"><span class="icon-cross2"></span></button></div>');
        this.$blocker.append(this.$container);
        this.$elm = $('<div class="modal-content"></div>');
        this.$container.append(this.$elm);
        this.$elm.html('<div class="modal-loading">' + YB.spinnerHtml() + '</div>');

        var current = this.$elm;
        $.ajax({
            url: url,
            type: "POST",
            data: options.postData
        }).done(function (html) {
            current.html(html);
        }).fail(function () {
            YB.modal.close();
        });
    },
    close: function () {
        $('.modal-container:last').remove();
        $('.modal-container:last').addClass('current');

        if ($('.modal-container').length == 0) {
            $('body').css('overflow', '');
        }
    },
    closeAll: function () {
        $('.modal-container').remove();
        $('body').css('overflow', '');
    }
};

// -------------------------------------------
// Window and body event bindings
// -------------------------------------------
yQuery

// Confirm page exit when there's text in the post form
// -------------------------------------------
    .on('beforeunload', false, function (e) {
        var textarea = $('#post-message');
        if (!YB.postForm.submitInProgress && textarea.is(':visible') && textarea.val().length != 0) {
            return messages.confirmUnload;
        } else {
            e = null;
        }
    })

    // Remove highlighted posts when hash is changed
    // -------------------------------------------
    .on('hashchange', false, function () {
        YB.post.removeHighlights();
    })

    // Make F5 function like clicking links and thus not reloading everything
    // -------------------------------------------
    .on('keydown', false, function (e) {
        if (!e.ctrlKey && !e.shiftKey && e.which == 116 || e.ctrlKey && !e.shiftKey && e.which == 82) { // F5 || CTRL + R
            YB.pageReload();
            return false;
        }
        if (e.ctrlKey && e.which == 13) {
            YB.postForm.submit(e);
        }
    })

    .on('click', '#post-form .bb-code', function () {
        YB.postForm.insertBbCode(event.target.dataset.code);
    })
    // Modal close
    // -------------------------------------------
    .on('click', '.modal-close', function () {
        YB.modal.close();
    })

    // Mobile menu
    // -------------------------------------------
    .on('click', '#sidebar', function (e) {
        if (e.offsetX > document.getElementById('sidebar').clientWidth) {
            document.getElementById('sidebar').classList.toggle('visible');
        }
    })
    .on('click', '.sidebar-toggle', function () {
        document.getElementById('sidebar').classList.toggle('visible');
    })
    .on('click', 'body >:not(#topbar):not(#sidebar)', function () {
        document.getElementById('sidebar').classList.remove('visible');
    })

    // Theme switcher
    // -------------------------------------------
    .on('click', '.switch-theme', function () {
        YB.theme.switchVariation();
    })

    // AJAX forms
    // -------------------------------------------
    .on('submit', 'form.ajax', function (event) {
        YB.submitForm(event);
    })

    // Sidebar signup & hide
    // -------------------------------------------
    .on('click', '#login .signup', function (event) {
        YB.signup(this, event);
    })
    .on('click', '#sidebar-hide-button', function () {
        YB.theme.toggleSidebar();
    })
    })

    // Session management
    // -------------------------------------------
    .on('submit', 'form.sessiondestroy', function (event) {
        var sessionId = $(event.target).find('input').val();
        document.getElementById(sessionId).remove();
    })

    // Notifications
    // -------------------------------------------
    .on('click', '.open-notifications', function () {
        YB.notifications.get();
    })

    // Autoupdate
    // -------------------------------------------
    .on('click', '.get-replies', function () {
        var threadId = $(this).closest('.thread').data('id');
        YB.thread.ajaxUpdate.runOnce(threadId);
    })

    // Post files
    // -------------------------------------------
    .on('click', '.post figure.thumbnail .image', function (event) {
        if (event.ctrlKey || event.altKey) {
            return true;
        }
        event.preventDefault();
        YB.post.file.expand($(this).parent('figure'));
    })
    .on('click', '.post figure:not(.thumbnail) .image', function (event) {
        if (event.ctrlKey || event.altKey) {
            return true;
        }
        event.preventDefault();
        YB.post.file.restoreThumbnail($(this).parent('figure'));
    })

    .on('click', '.post figure.thumbnail .media', function (event) {
        if (event.ctrlKey || event.altKey) {
            return true;
        }
        event.preventDefault();
        YB.post.file.playMedia($(this).parent('figure'));
    })
    .on('click', '.stop-media', function (event) {
        event.preventDefault();
        YB.post.file.stopAllMedia();
    })

    // The post form
    // -------------------------------------------
    .on('click', '.add-post-reply', function (event) {
        event.preventDefault();
        YB.postForm.postReply(event.target.closest('.post').dataset.id);
        document.getElementById('post-message').focus();
    })
    .on('click', '.create-thread', function () {
        YB.postForm.show();
    })
    .on('click', '.add-reply', function (event) {
        YB.postForm.threadReply(event.target.closest('.thread').dataset.id);
    })
    .on('change', '#post-form #post-files', function () {
        YB.postForm.uploadFile();
    })
    .on('click', '#post-form #remove-file', function () {
        YB.postForm.removeFile();
    })
    .on('click', '#post-form .bb-color-bar', function () {
        YB.postForm.toggleBbColorBar();
    })
    .on('click', '#post-form .toggle-options', function (event) {
        event.preventDefault();
        document.getElementById('post-options').toggle();
    })
    .on('click', '#post-form #reset-button', function (event) {
        event.preventDefault();
        YB.postForm.reset();
    })
    .on('submit', '#post-form', function (event) {
        YB.postForm.submit(event);
    });


/*

 error: function (xhr, textStatus, errorThrown) {
 var errorMessage = errorThrown;
 var errorTitle = messages.errorOccurred;
 if (errorThrown.length == 0 && xhr.readyState == 0 && xhr.status == 0) {
 errorMessage = messages.networkError;
 } else if (errorThrown == 'timeout') {
 errorMessage = messages.timeoutWarning;
 } else {
 try {
 var text = JSON.parse(xhr.responseText);
 errorMessage = text.message;
 if (typeof text.title != 'undefined' && text.title != null && text.title.length != 0) {
 errorTitle = text.title;
 }
 } catch (e) {
 errorMessage = xhr.status + ' ' + errorThrown;
 }
 }

 if (xhr.status == '418') {
 toastr.info(errorMessage);
 } else {
 toastr.error(errorMessage, errorTitle);
 }
 }
 */
