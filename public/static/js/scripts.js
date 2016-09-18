// CSRF token to each request and disable caching
$.ajaxSetup({
    cache: false,
    timeout: 5000,
    headers: {
        'X-CSRF-Token': config.csrfToken
    },
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
});

// -------------------------------------------
// jQuery plugins
// -------------------------------------------
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

// -------------------------------------------
// "Private" functions used by other functions
// -------------------------------------------
var YB = {
    pageReload: function () {
        window.location = window.location.href.split('#')[0];
    },
    returnToBoard: function () {
        // Remove everything after the last slash and redirect
        // Should work if we are in a thread, otherwise not really
        var url = window.location.href;
        url = url.substr(0, url.lastIndexOf('/') + 1);

        window.location = url;
    },
    getSelectionText: function () {
        var text = '';
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        return text;
    },
    spinnerHtml: function (classes) {
        if (typeof classes == 'undefined') {
            classes = '';
        } else {
            classes += ' ';
        }

        return '<span class="' + classes + 'loading icon-loading spin"></span>';
    },
    submitForm: function (e) {
        e.preventDefault();

        if (!('FormData' in window)) {
            toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
            return false;
        }

        var form = $(e.target);
        var fd = new FormData(e.target);

        var overlay = $('<div class="form-overlay"><div>' + YB.spinnerHtml() + '</div></div>');
        form.append(overlay);

        $.ajax({
            url: form.attr('action'),
            type: "POST",
            processData: false,
            contentType: false,
            data: fd,
            dataType: 'json'
        }).done(function (data) {
            if (data.reload) {
                if (data.url) {
                    window.location = data.url;
                } else {
                    window.location.reload();
                }
            } else {
                overlay.remove();
                toastr.success(data.message);
                form.trigger('reset');
            }
        }).fail(function () {
            overlay.remove();
        });
    }, // Signup form in sidebar
    // -------------------------------------------
    signup: function (elm, e) {
        e.preventDefault();
        elm = $(elm);

        YB.captcha.render('signup-captcha', {
            'size': 'compact',
            'theme': 'dark'
        });

        var form = $('#login');
        var signupForm = $('#signup-form');

        if (typeof form.data('login') == 'undefined') {
            form.data('login', form.attr('action'));
        }

        if (!elm.data('open')) {
            form.attr('action', form.data('signup'));
            elm.html(messages.cancel);
            $('#loginbutton').val(messages.signUp);
            signupForm.slideDown();
            elm.data('open', true);
        } else {
            form.attr('action', form.data('login'));
            elm.html(messages.signUp);

            $('#loginbutton').val(messages.logIn);
            signupForm.slideUp();
            signupForm.find('input').val('');
            elm.data('open', false);
        }
    }
};

// -------------------------------------------
// reCAPTCHA
// -------------------------------------------
YB.captcha = {
    render: function (elm, options) {
        options = $.extend({
            'sitekey': config.reCaptchaPublicKey
        }, options);

        if (typeof grecaptcha == 'undefined' || !$('#' + elm).is('*')) {
            return false;
        }

        if ($('#' + elm).html().length != 0) {
            return true;
        }
        grecaptcha.render(elm, options);
    },
    reset: function () {
        if (typeof grecaptcha == 'undefined') {
            return true;
        }

        grecaptcha.reset();
    }
};
// Onload render callback
function renderCaptcha() {
    YB.captcha.render('post-form-captcha');
}

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
// Thread functions
// -------------------------------------------
YB.thread = {
    getElm: function (id) {
        return $('#thread-' + id);
    },
    toggleLock: function (id) {
        if (this.getElm(id).find('h3 a .icon-lock').length == 0) {
            $.post('/scripts/threads/lock', {'threadId': id}).done(function () {
                YB.thread.getElm(id).find('h3 a').prepend('<span class="icon-lock icon"></span>');
                toastr.success(messages.threadLocked);
            });
        } else {
            $.post('/scripts/threads/unlock', {'threadId': id}).done(function () {
                YB.thread.getElm(id).find('h3 a .icon-lock').remove();
                toastr.success(messages.threadUnlocked);
            });
        }
    },
    toggleSticky: function (id) {
        if (this.getElm(id).find('h3 a .icon-lock').length == 0) {
            $.post('/scripts/threads/stick', {'threadId': id}).done(function () {
                YB.thread.getElm(id).find('h3 a').prepend('<span class="icon-pushpin icon"></span>');
                toastr.success(messages.threadStickied);
            });
        } else {
            $.post('/scripts/threads/unstick', {'threadId': id}).done(function () {
                YB.thread.getElm(id).find('h3 a .icon-pushpin').remove();
                toastr.success(messages.threadUnstickied);
            });
        }
    }, // Thread inline expansion
    // -------------------------------------------
    expand: function (threadId) {
        var thread = this.getElm(threadId);
        if (!thread.hasClass('expanded')) {
            // Expand
            thread.addClass('expanded', true);

            var fromId = thread.find('.reply:first').attr('id').replace('post-', '');

            $.post('/scripts/threads/getreplies', {
                'threadId': threadId,
                'fromId': fromId
            }).done(function (data) {
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
};

// Thread hiding
// -------------------------------------------
YB.thread.hide = {
    add: function (id) {
        YB.thread.getElm(id).fadeToggle();
        $.post('/scripts/threads/hide', {'threadId': id}).done(function () {
            toastr.success(messages.threadHidden + '<button class="link thread-restore" data-id="' + id + '">' + messages.undo + '</button>');
        }).fail(function () {
            YB.thread.getElm(id).stop().show();
        });
    },
    remove: function (id) {
        YB.thread.getElm(id).fadeToggle();
        $.post('/scripts/threads/restore', {'threadId': id}).done(function () {
            toastr.success(messages.threadRestored + '<button class="link thread-hide" data-id="' + id + '">' + messages.undo + '</button>');
        }).fail(function () {
            YB.thread.getElm(id).stop().show();
        });
    }
};

// Thread following
// -------------------------------------------
YB.thread.follow = {
    add: function (id) {
        this.doAjax(id, '/scripts/follow/add');
    },
    remove: function (id) {
        this.doAjax(id, '/scripts/follow/remove');
    },
    markAllRead: function () {
        $('.icon-bookmark2 .unread-count').hide();
        $('h3 .notification-count').hide();
        $.post('/scripts/follow/markallread').fail(function () {
            $('.icon-bookmark2 .unread-count').show();
            $('h3 .notification-count').show();
        });
    },
    toggleButton: function (id) {
        var button = YB.thread.getElm(id).find('.followbutton');

        if (button.hasClass('add')) {
            button
                .removeClass('icon-bookmark-add add')
                .addClass('icon-bookmark-remove remove');
        } else {
            button
                .removeClass('icon-bookmark-remove remove')
                .addClass('icon-bookmark-add add');
        }
    },
    doAjax: function (id, url) {
        this.toggleButton(id);
        $.post(url, {'threadId': id}).fail(function () {
            YB.thread.follow.toggleButton(id);
        });
    }
};

// -------------------------------------------
// Post functions
// -------------------------------------------
YB.post = {
    getElm: function (id) {
        return $('#post-' + id);
    },
    delete: function (id) {
        if (!confirm(messages.confirmDeletePost)) {
            return false;
        }

        $.post('/scripts/posts/delete', {'postId': id}).done(function () {
            this.getElm(id).remove();
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
        this.getElm(id).addClass('highlighted');
    },
    removeHighlights: function () {
        $('.highlighted').removeClass('highlighted');
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
    }, // Expand images
    // -------------------------------------------
    expandImage: function (elm, e) {
        e.preventDefault();
        var container = $(elm).parent();
        var post = container.parent('.message');
        var img = $(elm).find('img');

        if (typeof img.data('expanding') != 'undefined') {
            return true;
        }

        post.addClass('full');

        if (typeof img.data('orig-src') == 'undefined') {
            img.data('orig-src', img.attr('src'));
            this.changeSrc(img, container.find('figcaption a').attr('href'));
            container.removeClass('thumbnail');
        } else {
            this.changeSrc(img, img.data('orig-src'));
            img.removeData('orig-src');
            container.addClass('thumbnail');
        }

        // Scroll to top of image
        var elmTop = container.offset().top;
        if ($(document).scrollTop() > elmTop) {
            $(document).scrollTop(elmTop);
        }
    },
    changeSrc: function (img, src) {
        img.data('expanding', 'true');
        var loading = setTimeout(function () {
            img.after(YB.spinnerHtml('overlay center'));
        }, 200);
        img.attr('src', src).on('load', function () {
            img.removeData('expanding');
            clearTimeout(loading);
            img.parent().find('.loading').remove();
        });
    },

    // Media player
    // -------------------------------------------
    playMedia: function (elm, e) {
        e.preventDefault();
        this.stopAllMedia();

        var link = $(elm);
        var container = link.parent();
        var post = container.parent('.message');
        var img = link.find('img');

        var fileId = container.data('id');

        if (typeof link.data('loading') != 'undefined') {
            return false;
        }

        link.data('loading', 'true');

        var loading = setTimeout(function () {
            img.after(YB.spinnerHtml('overlay bottom left'));
        }, 200);

        $.post('/scripts/files/getmediaplayer', {'fileId': fileId}).done(function (data) {
            container.removeClass('thumbnail').addClass('media-player-container');
            post.addClass('full');
            container.prepend(data);

            var volume = YB.localStorage.get('videoVolume');
            if (volume != null) {
                container.find('video').prop('volume', volume);
            }
        }).always(function () {
            clearTimeout(loading);
            container.find('.loading').remove();
            link.removeData('loading');
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
YB.localStorage = {
    store: function (key, val) {
        if (!this.isAvailable()) {
            return false;
        }

        return localStorage.setItem(key, val);
    },
    get: function (key) {
        if (!this.isAvailable()) {
            return false;
        }

        return localStorage.getItem(key);
    },
    remove: function (key) {
        if (!this.isAvailable()) {
            return false;
        }

        return localStorage.removeItem(key);
    },
    isAvailable: function () {
        if (typeof localStorage == 'undefined') {
            toastr.warning(messages.oldBrowserWarning);

            return false;
        }

        return true;
    }
};

// -------------------------------------------
// Post moderation
// -------------------------------------------
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

// -------------------------------------------
// Functions related to post form
// -------------------------------------------
YB.postForm = {
    elm: $('#post-form'),
    location: $('#post-form').prev(),
    msgElm: $('#post-form').find('#post-message'),
    fileUploadInProgress: false,
    fileUploadXhr: null,
    submitAfterFileUpload: false,
    submitInProgress: false,
    origDestName: false,
    origDestValue: false,
    show: function (isReply) {
        if (!isReply) {
            // Reset if we click the "Create thread" -button
            this.reset();
        }

        this.elm.addClass('visible');
        if (this.msgElm.is(':visible')) {
            this.msgElm.focus();
        }
    },
    hide: function () {
        this.elm.removeClass('visible');
    },
    reset: function () {
        this.elm[0].reset();
        this.elm.insertAfter(this.location);

        this.removeFile();
        this.resetDestination();
        this.hide();
    },
    focus: function () {
        this.msgElm.focus();
    },
    setDestination: function (isReply, destination) {
        this.storeDestination();
        var name = 'board';
        if (isReply) {
            name = 'thread';
        }
        this.elm.find('#post-destination').attr('name', name).val(destination);
    },
    storeDestination: function () {
        var destElm = this.elm.find('#post-destination');
        var boardSelector = this.elm.find('#label-board');

        // Hide board selector
        if (boardSelector.is('*')) {
            boardSelector.hide().find('select').removeAttr('required');
            return true;
        }

        if (this.origDestName) {
            return true;
        }

        this.origDestName = destElm.attr('name');
        this.origDestValue = destElm.val();

        return true;
    },
    resetDestination: function () {
        var destElm = this.elm.find('#post-destination');
        var boardSelector = this.elm.find('#label-board');

        // Restore board selector
        if (boardSelector.is('*')) {
            boardSelector.show().find('select').attr('required', true);
        }

        if (!this.origDestName) {
            return true;
        }

        destElm.attr('name', this.origDestName);
        destElm.val(this.origDestValue);

        this.origDestName = false;
        this.origDestValue = false;

        return true;
    },
    insertBbCode: function (code) {
        this.msgElm.insertAtCaret('[' + code + ']', '[/' + code + ']');
    },
    toggleBbColorBar: function () {
        this.elm.find('#color-buttons').toggle();
        this.msgElm.focus();
    },
    uploadFile: function () {
        if (!('FormData' in window)) {
            toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
            return false;
        }

        var fileInput = this.elm.find('#post-files');

        $('#file-name').val('');
        this.submitAfterFileUpload = false;

        // Abort any ongoing uploads
        if (this.fileUploadXhr !== null) {
            this.fileUploadXhr.abort();
        }

        this.updateFileProgressBar(1);

        // Calculate upload size and check it does not exceed the set maximum
        var maxSize = fileInput.data('maxsize');
        var fileList = fileInput[0].files;
        var fileSizeSum = 0;
        for (var i = 0, file; file = fileList[i]; i++) {
            fileSizeSum += file.size;
        }

        if (fileSizeSum > maxSize) {
            toastr.warning(messages.maxSizeExceeded);
            this.updateFileProgressBar(0);
            return false;
        }

        var fd = new FormData();
        fd.append('file', fileInput[0].files[0]);

        this.fileUploadInProgress = true;

        var fileName = this.elm.find('#post-files').val().split('\\').pop().split('.');
        fileName.pop();
        this.elm.find('#file-name').val(fileName.join('.'));

        var that = this;
        this.fileUploadXhr = $.ajax({
            url: '/scripts/files/upload',
            type: "POST",
            processData: false,
            contentType: false,
            data: fd,
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                if (!xhr.upload) {
                    return xhr;
                }
                xhr.upload.addEventListener('progress', function (evt) {
                    if (evt.lengthComputable) {
                        var percent = Math.round((evt.loaded / evt.total) * 100);
                        if (percent < 1) {
                            percent = 1;
                        } else if (percent > 95) {
                            percent = 95;
                        }
                        that.updateFileProgressBar(percent);
                    }
                }, false);
                return xhr;
            }
        }).always(function () {
            that.fileUploadInProgress = false;
        }).done(function (data) {
            that.updateFileProgressBar(100);
            data = JSON.parse(data);
            if (data.message.length != 0) {
                that.elm.find('#file-id').val(data.message);

                if (that.submitAfterFileUpload) {
                    this.submit();
                }
            } else {
                toastr.error(messages.errorOccurred);
                that.updateFileProgressBar(0);
            }
        }).fail(function () {
            that.updateFileProgressBar(0);
        });
    },
    removeFile: function () {
        this.elm.find('#post-files').val('');
        this.elm.find('#file-id').val('');
        this.elm.find('#file-name').val('');
        this.updateFileProgressBar(0);
        this.submitAfterFileUpload = false;

        if (this.fileUploadXhr !== null) {
            this.fileUploadXhr.abort();
        }
    },
    updateFileProgressBar: function (progress) {
        if (progress < 0) {
            progress = 0;
        } else if (progress > 100) {
            progress = 100;
        }

        if (progress == 0) {
            this.elm.find('.file-progress div').css('width', 0).removeClass('in-progress');
        } else {
            this.elm.find('.file-progress div').css('width', progress + '%').addClass('in-progress');
        }
    },
    threadReply: function (threadId) {
        this.elm.appendTo(YB.thread.getElm(threadId).find('.thread-content'));
        this.show(true);

        this.setDestination(true, threadId);

        this.msgElm.focus();
    },
    postReply: function (postId) {
        var selectedText = YB.getSelectionText();

        this.elm.appendTo(YB.post.getElm(postId));
        this.show(true);

        this.setDestination(true, this.elm.closest('.thread').data('id'));

        this.msgElm.focus();
        var append = '';
        if (this.msgElm.val().substr(-1) == '\n') {
            append += '\n';
        } else if (this.msgElm.val().length != 0) {
            append += '\n\n';
        }
        append += '>>' + postId + '\n';

        // If any text on the page was selected, add it to post form with quotes
        if (selectedText != '') {
            append += '>' + selectedText.replace(/(\r\n|\n|\r)/g, '$1>') + '\n';
        }

        this.msgElm.val(this.msgElm.val().trim() + append);
    },
    submit: function (e) {
        if (typeof e != 'undefined') {
            e.preventDefault();
        }

        if (!('FormData' in window)) {
            toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
            return false;
        }

        var submitButton = this.elm.find('input[type="submit"].button');

        // File upload in progress -> wait until done
        if (this.fileUploadInProgress) {
            submitButton.attr('disabled', true);
            this.submitAfterFileUpload = true;
            return false;
        }

        // Prevent duplicate submissions by double clicking etc.
        if (this.submitInProgress) {
            return false;
        }
        this.submitInProgress = true;

        this.elm.find('#post-files').val('');

        var fd = new FormData(this.elm[0]);

        var that = this;
        $.ajax({
            url: this.elm.attr('action'),
            type: "POST",
            processData: false,
            contentType: false,
            data: fd
        }).done(function (data) {
            var dest = $('#post-destination');
            var thread;
            if (dest.attr('name') != 'thread') {
                thread = null;
            } else {
                thread = dest.val();
            }

            if (thread != null) {
                toastr.success(messages.postSent);
                YB.thread.ajaxUpdate.runOnce(thread);
            } else if (data.length == 0) {
                YB.pageReload();
            } else {
                data = JSON.parse(data);
                if (typeof data.message == 'undefined') {
                    toastr.error(messages.errorOccurred);
                } else {
                    window.location = '/' + that.elm.find('[name="board"]').val() + '/' + data.message;
                }
            }

            // Reset post form
            that.reset();
        }).always(function () {
            submitButton.removeAttr('disabled');
            that.submitInProgress = false;

            YB.captcha.reset();
        });
    }
};

// -------------------------------------------
// Spoilers & reflinks
// -------------------------------------------
var reflinkCreateTimeout;
$('body:not(.board-catalog)')
    .on('touchstart', '.spoiler:not(.spoiled)', function (e) {
        e.preventDefault();
        $(this).addClass('spoiled');
    })
    .on('click', function (e) {
        $('.spoiler.spoiled').removeClass('spoiled');
    })
    .on('contextmenu', '.reflink', function (e) {
        e.preventDefault();
    })
    .on('touchstart mouseenter', '.reflink:not(.tooltipstered)', function (e) {
        var elm = $(this);
        reflinkCreateTimeout = setTimeout(function () {
            e.preventDefault();
            var id = elm.data('id');
            var content = YB.spinnerHtml();
            if (YB.post(id).is('*')) {
                content = YB.post(id).html();
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
        if (YB.post(id).is('*')) {
            e.preventDefault();
            window.location = window.location.href.split('#')[0] + '#post-' + id;
        }
    });

// -------------------------------------------
// Basic tooltips
// -------------------------------------------
$('.tooltip').tooltipster({
    side: 'bottom',
    animationDuration: 0,
    delay: 0,
    trigger: 'click'
});

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
$(window)
// Confirm page exit when there's text in the post form
// -------------------------------------------
    .on('beforeunload', function (e) {
        var textarea = $('#post-message');
        if (!YB.postForm.submitInProgress && textarea.is(':visible') && textarea.val().length != 0) {
            return messages.confirmUnload;
        } else {
            e = null;
        }
    })

    // Remove highlighted posts when hash is changed
    // -------------------------------------------
    .on('hashchange', function () {
        YB.post.removeHighlights();
    })

    // Make F5 function like clicking links and thus not reloading everything
    // -------------------------------------------
    .on('keydown', function (e) {
        if (e.which == 116 && !e.ctrlKey || e.which == 82 && e.ctrlKey && !e.shiftKey) { // F5 || CTRL + R
            YB.pageReload();
            return false;
        }
    });

$('body')
// Modal close
// -------------------------------------------
    .on('click', '.modal-close', function () {
        YB.modal.close();
    })

    // Mobile menu
    // -------------------------------------------
    .on('click', '#sidebar', function (e) {
        if (e.offsetX > $('#sidebar').innerWidth()) {
            $('#sidebar').toggleClass('visible');
        }
    })
    .on('click', '.sidebar-toggle', function () {
        $('#sidebar').toggleClass('visible');
    })
    .on('click', '>:not(#topbar):not(#sidebar)', function () {
        $('#sidebar.visible').removeClass('visible');
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

    // Session management
    // -------------------------------------------
    .on('submit', 'form.sessiondestroy', function (event) {
        var sessionId = $(event.target).find('input').val();
        $('#' + sessionId).fadeOut();
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

    // The post form
    // -------------------------------------------
    .on('click', '.post-id', function () {
        var postId = $(this).closest('.post').data('id');
        YB.postForm.postReply(postId);
        $('#post-message').focus();
    })
    .on('click', '.create-thread, .add-reply', function () {
        YB.postForm.show();
    })
    .on('click', '.add-reply', function () {
        YB.postForm.setDestination(true, $(this).data('thread'));
    })
    .on('change', '#post-form #post-files', function () {
        YB.postForm.uploadFile();
    })
    .on('click', '#post-form #remove-file', function () {
        YB.postForm.removeFile();
    })
    .on('click', '#post-form .bb-code', function () {
        YB.postForm.insertBbCode($(this).data('code'));
    })
    .on('click', '#post-form .bb-color-bar', function () {
        YB.postForm.toggleBbColorBar();
    })
    .on('click', '#post-form .toggle-options', function (event) {
        event.preventDefault();
        $('#post-options').toggle();
    })
    .on('click', '#post-form #reset-button', function (event) {
        event.preventDefault();
        YB.postForm.reset();
    })
    .on('submit', '#post-form', function (event) {
        YB.postForm.submit(event);
    });
