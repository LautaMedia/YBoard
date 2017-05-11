// -------------------------------------------
// jQuery plugins
// -------------------------------------------
/*
jQuery.fn.extend({
    insertAtCaret: function (before, after) {
        if (typeof after == 'undefined') {
            after = '';
        }

        return this.each(function () {
            if (document.selection) {
                // IE
                var sel = document.selection.createRange();
                sel.text = before + sel.text + after;
                this.focus();
            } else if (this.selectionStart || this.selectionStart == '0') {
                // FF & Chrome
                var selectedText = this.value.substr(this.selectionStart, (this.selectionEnd - this.selectionStart));
                var startPos = this.selectionStart;
                var endPos = this.selectionEnd;
                this.value = this.value.substr(0, startPos) + before + selectedText + after + this.value.substr(endPos, this.value.length);

                // Move selection to end of "before" -tag
                this.selectionStart = startPos + before.length;
                this.selectionEnd = startPos + before.length;

                this.focus();
            } else {
                // Nothing selected/not supported, append
                this.value += before + after;
                this.focus();
            }
        });
    },
    localizeTimestamp: function () {
        return this.each(function () {
            this.innerHTML = new Date(this.innerHTML.replace(' ', 'T') + 'Z').toLocaleString();
        });
    },
    localizeNumber: function () {
        return this.each(function () {
            this.innerHTML = parseFloat(this.innerHTML).toLocaleString();
        });
    },
    localizeCurrency: function () {
        return this.each(function () {
            this.innerHTML = parseFloat(this.innerHTML).toLocaleString(true, {
                'style': 'currency',
                'currency': 'eur'
            });
        });
    }
});

// -------------------------------------------
// Localize dates and numbers
// -------------------------------------------
$('.datetime').localizeTimestamp();
$('.number').localizeNumber();
$('.currency').localizeCurrency();
*/

// -------------------------------------------
// Theme functions
// -------------------------------------------
YB.theme = {
    toggleSidebar: function () {
        if ($('#hide-sidebar').is('*')) {
            $('#hide-sidebar').remove();
            $('#sidebar').removeClass('visible');
        } else {
            $('<link>').attr({
                'rel': 'stylesheet',
                'id': 'hide-sidebar',
                'href': config.staticUrl + '/css/hide_sidebar.css',
            }).appendTo('head');
        }

        $.post('/scripts/preferences/togglesidebar');
    },
    switchVariation: function () {
        var css = $('.css:last');
        var current = css.attr('href');
        var variation = css.data('alt');

        $('<link>').attr({
            'rel': 'stylesheet',
            'class': 'css',
            'href': variation,
            'data-alt': current
        }).insertAfter(css);

        var timeout = setTimeout(function () {
            css.remove();
        }, 5000);

        $.post('/scripts/preferences/togglethemevariation').fail(function () {
            clearTimeout(timeout);
        });
    }
};

// -------------------------------------------
// Post functions
// -------------------------------------------
YB.post = {
    getElm: function (id) {
        return document.getElementById('post-' + id);
    },
    delete: function (id) {
        if (!confirm(messages.confirmDeletePost)) {
            return false;
        }

        var that = this;
        $.post('/scripts/posts/delete', {'postId': id}).done(function () {
            that.getElm(id).remove();
            if ($('body').hasClass('thread-page')) {
                if (YB.thread.getElm(id).is('*')) {
                    // We're in the thread we just deleted
                    YB.returnToBoard();
                }
            } else {
                // The deleted post is not the current thread
                YB.thread.getElm(id).remove();
                toastr.success(messages.postDeleted);
            }
        });
    }, // Post higlighting
    // -------------------------------------------
    highlight: function (id) {
        this.getElm(id).classList.add('highlighted');
    },
    removeHighlights: function () {
        var elems = document.getElementsByClassName('highlighted');
        while (elems.length) {
            elems[0].classList.remove('highlighted');
        }
    }
};
// File functions
// -------------------------------------------
YB.post.file = {
    delete: function (id) {
        if (!confirm(messages.confirmDeleteFile)) {
            return false;
        }

        $.post('/scripts/posts/deletefile', {'post_id': id}).done(function () {
            this.getElm(id).find('figure').remove();
            toastr.success(messages.fileDeleted);
        });
    },

    // Expand images
    // -------------------------------------------
    expand: function (elm) {
        var img = $(elm).find('img');
        elm.parent('.message').addClass('full');

        img.data('orig-src', img.attr('src'));
        this.changeSrc(img, elm.find('figcaption a').attr('href'));
        elm.removeClass('thumbnail');
    },
    restoreThumbnail: function (elm) {
        var img = $(elm).find('img');

        this.changeSrc(img, img.data('orig-src'));
        elm.addClass('thumbnail');

        // Scroll to top of image
        var elmTop = elm.offset().top;
        if ($(document).scrollTop() > elmTop) {
            $(document).scrollTop(elmTop);
        }
    },
    changeSrc: function (img, src) {
        img.data('expanding', 'true');
        var loading = setTimeout(function () {
            img.after('<div class="overlay center">' + YB.spinnerHtml() + '</div>');
        }, 200);
        img.attr('src', src).on('load', function () {
            img.removeData('expanding');
            clearTimeout(loading);
            img.next('div.overlay').remove();
        });
    },

    // Media player
    // -------------------------------------------
    playMedia: function (elm) {
        this.stopAllMedia();

        var post = elm.parent('.message');
        var img = elm.find('img');

        var fileId = elm.data('id');

        if (typeof elm.data('loading') != 'undefined') {
            return false;
        }

        elm.data('loading', 'true');

        var loading = setTimeout(function () {
            img.after('<div class="overlay bottom left">' + YB.spinnerHtml() + '</div>');
        }, 200);

        $.post('/scripts/files/getmediaplayer', {'fileId': fileId}).done(function (data) {
            elm.removeClass('thumbnail').addClass('media-player-container');
            post.addClass('full');
            elm.prepend(data);

            var volume = YB.localStorage.get('videoVolume');
            if (volume != null) {
                elm.find('video').prop('volume', volume);
            }
        }).always(function () {
            clearTimeout(loading);
            elm.find('div.overlay').remove();
            elm.removeData('loading');
        });
    },
    stopAllMedia: function () {
        $('.media-player-container').each(function () {
            var self = $(this);
            var mediaPlayer = self.find('.media-player');

            mediaPlayer.find('video').trigger('pause');
            mediaPlayer.remove();

            self.removeClass('media-player-container').addClass('thumbnail');
        });
    },
    saveVolume: function (elm) {
        YB.localStorage.store('videoVolume', $(elm).prop("volume"));
    }
};

// Reporting
// -------------------------------------------
YB.post.report = {
    openForm: function () {
        YB.modal.open('/scripts/report/getform', {
            'onAjaxComplete': function () {
                YB.captcha.render('report-captcha');
                $('#report-post-id').val(id);
            }
        });
    },
    submit: function (event) {
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
            type: "POST",
            processData: false,
            contentType: false,
            data: fd
        }).done(function () {
            toastr.success(messages.postReported);
            YB.modal.closeAll();
        }).fail(function (xhr) {
            if (xhr.status == '418') {
                YB.modal.closeAll();
            } else {
                $(event.target).html(oldHtml);
            }
        });
    },
    setChecked: function (postId) {
        $.post('/scripts/mod/reports/setchecked', {'postId': postId}).done(function () {
            toastr.success(messages.reportCleared);
            YB.post.getElm(postId).remove();
        });
    }
};

// -------------------------------------------
// LocalStorage wrappers
// -------------------------------------------
YB.

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

// -------------------------------------------
// Notifications
// -------------------------------------------
YB.notifications = {
    get: function () {
        YB.modal.open('/scripts/notifications/get', {
            'onAjaxComplete': function () {
                this.updateUnreadCount($('.notifications-list .not-read').length);
            }
        });
    },
    markRead: function (id, e) {
        if (typeof e != 'undefined') {
            e.preventDefault();
        }

        $('#n-' + id).removeClass('not-read').addClass('is-read');
        $.post('/scripts/notifications/markread', {'id': id}).done(function () {
            if (typeof e != 'undefined') {
                window.location = e.target.getAttribute('href');
            }
        });

        this.updateUnreadCount($('.notification.not-read').length);
    },
    markAllRead: function () {
        $.post('/scripts/notifications/markallread');
        this.updateUnreadCount(0);
    },
    updateUnreadCount: function (count) {
        var elm = $('.unread-notifications');
        elm.html(parseInt(count));

        if (count == 0) {
            elm.addClass('none');
        } else {
            elm.removeClass('none');
        }
    }
};

// -------------------------------------------
// Thread ajax reply update
// -------------------------------------------
YB.thread.ajaxUpdate = {
    threadId: false,
    nextLoadDelay: 2000,
    newReplies: 0,
    lastUpdateNewReplies: 0,
    runCount: 0,
    nowLoading: false,
    isActive: false,
    nextRunTimeout: 0,
    startDelayTimeout: 0,
    originalDocTitle: document.title,

    run: function (manual) {
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

        var thread = YB.thread.getElm(this.threadId);
        var fromId = thread.find('.reply:last').attr('id');
        if (typeof fromId == 'undefined') {
            fromId = 0;
        } else {
            fromId = fromId.replace('post-', '');
        }

        this.nowLoading = true;
        var that = this;
        $.post('/scripts/threads/getreplies', {
            'threadId': this.threadId,
            'fromId': fromId,
            'newest': true
        }).done(function (data) {
            if (manual && data.length == 0) {
                toastr.info(messages.noNewReplies);
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
                that.nextRunTimeout = setTimeout(function () {
                    that.start();
                }, that.nextLoadDelay);
            }
        }).fail(function () {
            that.stop();
        }).always(function () {
            that.nowLoading = false;

            // Notify about new posts on title
            if (!document.hasFocus() && that.newReplies > 0 && $('body').hasClass('thread-page')) {
                document.title = '(' + that.newReplies + ') ' + that.originalDocTitle;
                var replies = $('.replies');
                replies.find('hr').remove();
                replies.find('.reply:eq(-' + that.newReplies + ')').before('<hr>');
            } else if (self.newReplies != 0) {
                that.newReplies = 0;
            }
        });
    },
    runOnce: function (thread) {
        this.threadId = thread;
        this.run(true);
    },
    start: function () {
        this.isActive = true;
        if (this.startDelayTimeout) {
            clearTimeout(this.startDelayTimeout);
        }

        var that = this;
        this.threadId = $('.thread:first').data('id');
        this.startDelayTimeout = setTimeout(function () {
            that.run(false);
        }, 1000);

        return true;
    },
    stop: function () {
        if (!this.isActive) {
            return true;
        }

        if (this.startDelayTimeout) {
            clearTimeout(this.startDelayTimeout);
        }
        this.isActive = false;

        this.reset();
        return true;
    },
    restart: function () {
        this.stop();
        this.start();
    },
    reset: function () {
        this.nowLoading = false;
        this.newReplies = 0;
        this.runCount = 0;
        if (document.title != this.originalDocTitle) {
            document.title = this.originalDocTitle;
        }

        if (this.nextRunTimeout) {
            clearTimeout(this.nextRunTimeout);
        }
    }
};

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
function searchCatalog(word) {
    var threads = $('.thread-box');
    if (word.length == 0) {
        threads.show();
    } else {
        threads.hide();
        threads.each(function () {
            var self = $(this);
            if (self.find('h3').html().toLowerCase().indexOf(word.toLowerCase()) !== -1) {
                $(this).show();
                return true;
            }
            if (self.find('.post').html().toLowerCase().indexOf(word.toLowerCase()) !== -1) {
                $(this).show();
                return true;
            }
        });
    }
}

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
