// CSRF token to each request and disable caching
$.ajaxSetup({
    cache: false,
    timeout: 5000,
    headers: {
        'X-CSRF-Token': config.csrfToken
    },
    error: function(xhr, textStatus, errorThrown) {
        var errorMessage = errorThrown;
        if (errorThrown == 'timeout') {
            errorMessage = messages.timeoutWarning;
        } else {
            try {
                var text = JSON.parse(xhr.responseText);
                errorMessage = text.message;
            } catch (e) {
                errorMessage = xhr.status + ' ' + errorThrown;
            }
        }
        if (errorThrown.length == 0 && xhr.readyState == 0 && xhr.status == 0) {
            errorMessage = messages.networkError;
        }

        if (xhr.status == '418') {
            toastr.info(errorMessage);
        } else {
            toastr.error(errorMessage, messages.errorOccurred);
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
jQuery.fn.reverse = [].reverse;

// -------------------------------------------
// Post reporting
// -------------------------------------------
function reportPost(postId) {
    $.modal.open('/scripts/report/getform', {
        'onAjaxComplete': function () {
            if (typeof grecaptcha != 'undefined' && $('#report-captcha').html().length == 0) {
                grecaptcha.render('report-captcha', {
                    'sitekey': config.reCaptchaPublicKey
                });
            }
            $('#report-post-id').val(id);
        }
    });
}

function submitReport(e) {
    e.preventDefault();

    if (!('FormData' in window)) {
        toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
        return false;
    }

    var form = $(e.target);
    var fd = new FormData(e.target);

    var oldHtml = $(e.target).html();
    $(e.target).html(loadingAnimation());

    $.ajax({
        url: form.attr('action'),
        type: "POST",
        processData: false,
        contentType: false,
        data: fd
    }).done(function () {
        toastr.success(messages.postReported);
        closeModals();
    }).fail(function () {
        if (xhr.status == '418') {
            $.modal.closeAll();
        } else {
            $(e.target).html(oldHtml);
        }
    });
}

// -------------------------------------------
// Post deletion
// -------------------------------------------
function deletePost(id) {
    if (!confirm(messages.confirmDeletePost)) {
        return false;
    }

    $.ajax({
        url: '/scripts/posts/delete',
        type: "POST",
        data: {'post_id': id}
    }).done(function () {
        $p(id).remove();
        if ($('body').hasClass('thread-page')) {
            if ($t(id).is('*')) {
                // We're in the thread we just deleted
                returnToBoard();
            }
        } else {
            // The deleted post is not the current thread
            $t(id).remove();
            toastr.success(messages.postDeleted);
        }
    });
}
function deleteFile(id) {
    if (!confirm(messages.confirmDeleteFile)) {
        return false;
    }

    $.ajax({
        url: '/scripts/posts/deletefile',
        type: "POST",
        data: {'post_id': id}
    }).done(function () {
        $p(id).find('figure').remove();
        toastr.success(messages.fileDeleted);
    });
}

// -------------------------------------------
// Thread following
// -------------------------------------------
function followThread(id) {
    toggleFollowButton(id);
    $.ajax({
        url: '/scripts/follow/add',
        type: "POST",
        data: {'thread_id': id}
    }).fail(function () {
        toggleFollowButton(id);
    });
}

function unfollowThread(id) {
    toggleFollowButton(id);
    $.ajax({
        url: '/scripts/follow/remove',
        type: "POST",
        data: {'thread_id': id}
    }).fail(function () {
        toggleFollowButton(id);
    });
}

function toggleFollowButton(threadId) {
    var button = $t(threadId).find('.followbutton');

    if (button.hasClass('icon-bookmark-add')) {
        button
            .removeClass('icon-bookmark-add')
            .addClass('icon-bookmark-remove')
            .attr('onclick', 'unfollowThread(' + threadId + ')');
    } else {
        button
            .removeClass('icon-bookmark-remove')
            .addClass('icon-bookmark-add')
            .attr('onclick', 'followThread(' + threadId + ')');
    }
}

function markAllFollowedRead() {
    $('.icon-bookmark2 .unread-count').hide();
    $('h3 .notification-count').hide();
    $.ajax({
        url: '/scripts/follow/markallread',
        type: "POST"
    }).fail(function () {
        $('.icon-bookmark2 .unread-count').show();
        $('h3 .notification-count').show();
    });
}

// -------------------------------------------
// Thread hiding
// -------------------------------------------
function hideThread(id, showNotification) {
    showNotification = typeof showNotification == 'undefined';
    $t(id).fadeToggle();
    $.ajax({
        url: '/scripts/threads/hide',
        type: "POST",
        data: {'thread_id': id}
    }).done(function () {
        if (showNotification) {
            toastr.success(messages.threadHidden + '<button class="link" onclick="restoreThread(' + id + ', false)">' + messages.undo + '</button>');
        }
    }).fail(function () {
        $t(id).stop().show();
    });
}

function restoreThread(id, showNotification) {
    showNotification = typeof showNotification == 'undefined';
    $t(id).fadeToggle();
    $.ajax({
        url: '/scripts/threads/restore',
        type: "POST",
        data: {'thread_id': id}
    }).done(function () {
        if (showNotification) {
            toastr.success(messages.threadRestored + '<button class="link" onclick="hideThread(' + id + ', false)">' + messages.undo + '</button>');
        }
    }).fail(function () {
        $t(id).stop().show();
    });
}

// -------------------------------------------
// Signup form in sidebar
// -------------------------------------------
function signupForm(elm, e) {
    e.preventDefault();
    elm = $(elm);

    if (typeof grecaptcha != 'undefined' && $('#signup-captcha').html().length == 0) {
        grecaptcha.render('signup-captcha', {
            'sitekey': config.reCaptchaPublicKey,
            'size': 'compact',
            'theme': 'dark'
        });
    }

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

// -------------------------------------------
// Post moderation
// -------------------------------------------
function openModMenu(elm, postId) {

}
$('.mod-menu').tooltipster({
    content: loadingAnimation(),
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

function toggleThreadLock(id) {
    var url, callback;
    if ($t(id).find('h3 a .icon-lock').length == 0) {
        url = '/scripts/threads/lock';
        callback = function () {
            $t(id).find('h3 a').prepend('<span class="icon-lock icon"></span>');
            toastr.success(messages.threadLocked);
        };
    } else {
        url = '/scripts/threads/unlock';
        callback = function () {
            $t(id).find('h3 a .icon-lock').remove();
            toastr.success(messages.threadUnlocked);
        };
    }
    updateThread(url, callback, id);
}

function toggleThreadSticky(id) {
    var url, callback;
    if ($t(id).find('h3 a .icon-pushpin').length == 0) {
        url = '/scripts/threads/stick';
        callback = function () {
            $t(id).find('h3 a').prepend('<span class="icon-pushpin icon"></span>');
            toastr.success(messages.threadStickied);
        };
    } else {
        url = '/scripts/threads/unstick';
        callback = function () {
            $t(id).find('h3 a .icon-pushpin').remove();
            toastr.success(messages.threadUnstickied);
        };
    }
    updateThread(url, callback, id);
}

function updateThread(url, callback, id) {
    $.ajax({
        url: url,
        type: "POST",
        data: {'thread_id': id}
    }).done(function () {
        callback();
    });
}

function addBan(e) {
    e.preventDefault();

    if (!('FormData' in window)) {
        toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
        return false;
    }

    var fd = new FormData(e.target);

    var oldHtml = $(e.target).html();
    $(e.target).html(loadingAnimation());

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

function setReportChecked(postId)
{
    $.ajax({
        url: '/scripts/mod/reports/setchecked',
        type: "POST",
        data: {'post_id': postId}
    }).done(function () {
        toastr.success(messages.reportCleared);
        $p(postId).remove();
    });
}

// -------------------------------------------
// Notifications
// -------------------------------------------
function getNotifications() {
    openModal('/scripts/notifications/get', false, false, function () {
        updateUnreadNotificationCount($('.notifications-list .not-read').length);
    });
}

function markNotificationRead(id, e) {
    if (typeof e != 'undefined') {
        e.preventDefault();
    }

    $('#n-' + id).removeClass('not-read').addClass('is-read');
    $.ajax({
        url: '/scripts/notifications/markread',
        type: "POST",
        data: {'id': id}
    }).done(function() {
        if (typeof e != 'undefined') {
            window.location = e.target.getAttribute('href');
        }
    });

    updateUnreadNotificationCount($('.notification.not-read').length);
}

function markAllNotificationsRead() {
    $.ajax({
        url: '/scripts/notifications/markallread',
        type: "POST"
    });

    updateUnreadNotificationCount(0);
}

function updateUnreadNotificationCount(count) {
    var elm = $('.unread-notifications');
    elm.html(parseInt(count));

    if (count == 0) {
        elm.addClass('none');
    } else {
        elm.removeClass('none');
    }
}

// -------------------------------------------
// Thread inline expansion
// -------------------------------------------
function getMoreReplies(threadId) {
    var thread = $t(threadId);
    if (!thread.hasClass('expanded')) {
        // Expand
        thread.addClass('expanded', true);

        var fromId = thread.find('.reply:first').attr('id').replace('post-', '');

        $.ajax({
            url: '/scripts/threads/getreplies',
            type: "POST",
            data: {
                'thread_id': threadId,
                'from_id': fromId
            }
        }).done(function (data) {
            // Update timestamps
            data = $(data);
            data.find('.datetime').localizeTimestamp(this);

            $t(threadId).find('.more-replies-container').html(data);
        });
    } else {
        // Contract
        $t(threadId).removeClass('expanded').find('.more-replies-container').html('');
    }
}

// -------------------------------------------
// Thread ajax reply update
// -------------------------------------------
// FIXME: PLEASE do this better. This sucks ass.
var newReplies = 0;
var lastUpdateNewReplies = 0;
var updateCount = 0;
var loadingReplies = false;
var updateRunning = false;
var nextUpdateTimeout = false;
var documentTitle = document.title;
function getNewReplies(threadId, manual) {
    if (loadingReplies) {
        return false;
    }

    loadingReplies = true;
    if (typeof manual == 'undefined') {
        manual = false;
    }
    if (manual) {
        updateCount = 0;
        if (updateRunning) {
            stopAutoUpdate();
            startAutoUpdate();
        }
    }

    var thread = $t(threadId);
    var fromId = thread.find('.reply:last').attr('id');
    if (typeof fromId == 'undefined') {
        fromId = 0;
    } else {
        fromId = fromId.replace('post-', '');
    }

    $.ajax({
        url: '/scripts/threads/getreplies',
        type: "POST",
        data: {
            'thread_id': threadId,
            'from_id': fromId,
            'newest': true
        }
    }).done(function (data) {
        if (manual && data.length == 0) {
            toastr.info(messages.noNewReplies);
        }
        // Update timestamps
        data = $(data);
        data.find('.datetime').localizeTimestamp(this);

        lastUpdateNewReplies = data.find('.message').length;
        newReplies += lastUpdateNewReplies;

        data.appendTo(thread.find('.replies'));
    }).fail(function () {
        stopAutoUpdate();
    }).always(function () {
        setTimeout('loadingReplies = false', 100);
        updateAutoUpdateVars();
    });
}

if ($('body').hasClass('thread-page')) {
    var thread = $('.thread:first').data('id');
    $(window)
        .on('scroll', function () {
            var windowBottom = $(window).height() + $(window).scrollTop();
            var repliesBottom = $('.replies').offset().top + $('.replies').height();
            if (windowBottom > repliesBottom) {
                if (!updateRunning && !$('#post-message').is(':focus')) {
                    updateRunning = true;
                    startAutoUpdate();
                }
            } else {
                if (updateRunning) {
                    stopAutoUpdate();
                    updateRunning = false;
                }
            }
        })
        .on('focus', function () {
            newReplies = 0;
            updateCount = 0;
            if (document.title != documentTitle) {
                document.title = documentTitle;
            }
        });
    var startTimeout;
    $('#post-message')
        .on('focus', function () {
            clearTimeout(startTimeout);
            stopAutoUpdate();
        })
        .on('blur', function () {
            startTimeout = setTimeout('startAutoUpdate()', 500);
        });
}

function updateAutoUpdateVars() {
    if (lastUpdateNewReplies == 0) {
        ++updateCount;
    } else {
        updateCount = 0;
    }

    // Notify about new posts on title
    if (!document.hasFocus() && newReplies > 0 && $('body').hasClass('thread-page')) {
        document.title = '(' + newReplies + ') ' + documentTitle;
        var replies = $('.replies');
        replies.find('hr').remove();
        replies.find('.reply:eq(-' + newReplies + ')').before('<hr>');
    } else if (newReplies != 0) {
        newReplies = 0;
    }
}

function startAutoUpdate() {
    getNewReplies(thread);

    var timeout = 2000;
    timeout = timeout * (updateCount == 0 ? 1 : updateCount);
    if (timeout > 30000) {
        timeout = 30000;
    }

    // Limit
    if (updateCount > 40) {
        return false;
    }

    // Run again
    nextUpdateTimeout = setTimeout(function () {
        startAutoUpdate();
    }, timeout);
}

function stopAutoUpdate() {
    clearTimeout(nextUpdateTimeout);
}

// -------------------------------------------
// Functions related to post form
// -------------------------------------------
// FIXME: These functions might need reviewing
var postformLocation = $('#post-form').prev();
function showPostForm(isReply) {
    if (typeof isReply == 'undefined') {
        isReply = false;
    }

    if (!isReply) {
        // Reset if we click the "Create thread" -button
        resetPostForm();
    }

    var form = $('#post-form');
    form.addClass('visible');
    var textarea = $('#post-message');
    if (textarea.is(':visible')) {
        textarea.focus();
    }
}

function hidePostForm() {
    $('#post-form').removeClass('visible');
}

function resetPostForm() {
    var postForm = $('#post-form');
    postForm[0].reset();
    postForm.insertAfter(postformLocation);

    removePostFile();
    resetOriginalPostFormDestination();
    hidePostForm();
}

function addBbCode(code) {
    $('#post-message').insertAtCaret('[' + code + ']', '[/' + code + ']');
}

function toggleBbColorBar() {
    $('#color-buttons').toggle();
    $('#post-message').focus();
}

function replyToThread(id) {
    var postForm = $('#post-form');
    postForm.appendTo('#thread-' + id + ' .thread-content');
    showPostForm(true);

    saveOriginalPostFormDestination();
    $('#post-destination').attr('name', 'thread').val(postForm.closest('.thread').data('id'));

    $('#post-message').focus();
}

function replyToPost(id, newline) {
    var selectedText = getSelectionText();

    if (typeof newline == 'undefined') {
        newline = true;
    }

    var postForm = $('#post-form');
    postForm.appendTo('#post-' + id);
    showPostForm(true);

    saveOriginalPostFormDestination();
    $('#post-destination').attr('name', 'thread').val(postForm.closest('.thread').data('id'));

    var textarea = $('#post-message');
    textarea.focus();

    var append = '';
    if (textarea.val().substr(-1) == '\n') {
        append += '\n';
    } else if (textarea.val().length != 0 && newline) {
        append += '\n\n';
    }
    append += '>>' + id + '\n';

    // If any text on the page was selected, add it to post form with quotes
    if (selectedText != '') {
        append += '>' + selectedText.replace(/(\r\n|\n|\r)/g, '$1>') + '\n';
    }

    textarea.val(textarea.val().trim() + append);
}

function saveOriginalPostFormDestination() {
    var destElm = $('#post-destination');

    // Hide board selector
    if ($('#label-board').is('*')) {
        $('#label-board').hide().find('select').removeAttr('required');
        return true;
    }

    if (typeof destElm.data('orig-name') != 'undefined') {
        return true;
    }

    destElm.data('orig-name', destElm.attr('name'));
    destElm.data('orig-value', destElm.val());

    return true;
}

function resetOriginalPostFormDestination() {
    var destElm = $('#post-destination');

    // Restore board selector
    if ($('#label-board').is('*')) {
        $('#label-board').show().find('select').attr('required', true);
        destElm.removeAttr('name').removeAttr('value');
    }

    if (typeof destElm.data('orig-name') == 'undefined') {
        return true;
    }

    // In a thread or a board
    destElm.attr('name', destElm.data('orig-name'));
    destElm.val(destElm.data('orig-value'));

    return true;
}

function removePostFile() {
    $('#post-files').val('')
    $('#file-id').val('');
    $('#file-name').val('');
    $('#post-form').find('.progressbar').each(function () {
        updateProgressBar($(this), 0);
    });

    if (fileUploadXhr !== null) {
        fileUploadXhr.abort();
    }
}

var fileUploadInProgress = false;
var fileUploadXhr = null;
$('#post-files').on('change', function (e) {
    if (!('FormData' in window)) {
        toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
        return false;
    }

    var form = $(e.target);
    var fileInput = $(this);
    var progressBar = fileInput.parent().parent('.input-row').next('.file-progress');

    $('#file-name').val('');
    form.removeData('do-submit');

    // Abort any ongoing uploads
    if (fileUploadXhr !== null) {
        fileUploadXhr.abort();
    }

    progressBar.find('div').css('width', '1%');

    // Calculate upload size and check it does not exceed the set maximum
    var maxSize = fileInput.data('maxsize');
    var fileList = fileInput[0].files;
    var fileSizeSum = 0;
    for (var i = 0, file; file = fileList[i]; i++) {
        fileSizeSum += file.size;
    }

    if (fileSizeSum > maxSize) {
        toastr.warning(messages.maxSizeExceeded);
        return false;
    }

    var fd = new FormData();
    fd.append('file', this.files[0]);

    fileUploadInProgress = true;

    var fileName = $('#post-files').val().split('\\').pop().split('.');
    fileName.pop();
    $('#file-name').val(fileName.join('.'));

    fileUploadXhr = $.ajax({
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
                    updateProgressBar(progressBar, percent);
                }
            }, false);
            return xhr;
        }
    }).always(function () {
        fileUploadInProgress = false;
    }).done(function (data) {
        updateProgressBar(progressBar, 100);
        data = JSON.parse(data);
        if (data.message.length != 0) {
            $('#file-id').val(data.message);

            if (typeof $('#post-form').data('do-submit') != 'undefined') {
                submitPost();
            }
        } else {
            toastr.error(messages.errorOccurred);
            updateProgressBar(progressBar, 0);
        }
    }).fail(function () {
        updateProgressBar(progressBar, 0);
    });
});

function renderCaptcha() {
    grecaptcha.render('post-form-captcha', {
        'sitekey': config.reCaptchaPublicKey
    });
}

var submitInProgress;
function submitPost(e) {
    if (typeof e != 'undefined') {
        e.preventDefault();
    }

    if (!('FormData' in window)) {
        toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
        return false;
    }

    var form = $('#post-form');
    var submitButton = form.find('input[type="submit"].button');

    // File upload in progress -> wait until done
    if (fileUploadInProgress) {
        submitButton.attr('disabled', true);
        form.data('do-submit', 'true');
        return false;
    }

    // Prevent duplicate submissions by double clicking etc.
    if (submitInProgress) {
        return false;
    }
    submitInProgress = true;

    form.find('#post-files').val('');

    var fd = new FormData(form[0]);

    $.ajax({
        url: form.attr('action'),
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
            getNewReplies(thread, true);
        } else if (data.length == 0) {
            pageReload();
        } else {
            data = JSON.parse(data);
            if (typeof data.message == 'undefined') {
                toastr.error(messages.errorOccurred);
            } else {
                window.location = '/' + form.find('[name="board"]').val() + '/' + data.message;
            }
        }

        // Reset post form
        resetPostForm();
    }).always(function () {
        submitButton.removeAttr('disabled');
        submitInProgress = false;

        // Reset captcha if present
        if (typeof grecaptcha != 'undefined') {
            grecaptcha.reset();
        }
    });
}

function updateProgressBar(elm, progress) {
    if (progress < 0) {
        progress = 0;
    } else if (progress > 100) {
        progress = 100;
    }

    if (progress == 0) {
        elm.find('div').css('width', 0).removeClass('in-progress');
    } else {
        elm.find('div').css('width', progress + '%').addClass('in-progress');
    }
}

// -------------------------------------------
// Media player
// -------------------------------------------
function playMedia(elm, e) {
    e.preventDefault();
    stopAllMedia();

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
        img.after(loadingAnimation('overlay bottom left'));
    }, 200);

    $.ajax({
        url: '/scripts/files/getmediaplayer',
        type: "POST",
        data: {'file_id': fileId}
    }).done(function (xhr, textStatus, errorThrown) {

        container.removeClass('thumbnail').addClass('media-player-container');
        post.addClass('full');
        container.prepend(xhr);

        var volume = $.localStorage.get('videoVolume');
        if (volume != null) {
            container.find('video').prop('volume', volume);
        }
    }).always(function () {
        clearTimeout(loading);
        container.find('.loading').remove();
        link.removeData('loading');
    });
}

function stopAllMedia() {
    $('.media-player-container').each(function () {
        var self = $(this);
        var mediaPlayer = self.find('.media-player');

        mediaPlayer.find('video').trigger('pause');
        mediaPlayer.remove();

        self.removeClass('media-player-container').addClass('thumbnail');
    });
}

// Volume save
function saveVolume(elm) {
    $.localStorage.store('videoVolume', $(elm).prop("volume"));
}

// -------------------------------------------
// Expand images
// -------------------------------------------
function expandImage(elm, e) {
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
        changeSrc(img, container.find('figcaption a').attr('href'));
        container.removeClass('thumbnail');
    } else {
        changeSrc(img, img.data('orig-src'));
        img.removeData('orig-src');
        container.addClass('thumbnail');
    }

    // Scroll to top of image
    var elmTop = container.offset().top;
    if ($(document).scrollTop() > elmTop) {
        $(document).scrollTop(elmTop);
    }
}

function changeSrc(img, src) {
    img.data('expanding', 'true');
    var loading = setTimeout(function () {
        img.after(loadingAnimation('overlay center'));
    }, 200);
    img.attr('src', src).on('load', function () {
        img.removeData('expanding');
        clearTimeout(loading);
        img.parent().find('.loading').remove();
    });
}

// -------------------------------------------
// User profile related
// -------------------------------------------
function destroySession(sessionId) {
    $.ajax({
        url: '/scripts/user/destroysession',
        type: "POST",
        data: {'session_id': sessionId}
    }).done(function (xhr, textStatus, errorThrown) {
        $('#' + sessionId).fadeOut();
    });
}

function changeUsername(e) {
    e.preventDefault();

    var form = $(e.target);
    var newName = form.find('input[name="newname"]').val();
    var password = form.find('input[name="password"]').val();

    $.ajax({
        url: form.attr('action'),
        type: "POST",
        data: {
            'new_name': newName,
            'password': password
        }
    }).done(function (xhr, textStatus, errorThrown) {
        pageReload();
    });
}

function changePassword(e) {
    e.preventDefault();

    var form = $(e.target);
    var newPassword = form.find('input[name="newpass"]').val();
    var newPasswordRe = form.find('input[name="newpassre"]').val();
    var password = form.find('input[name="password"]').val();

    if (newPassword != newPasswordRe) {
        toastr.error(messages.passwordsDoNotMatch);
        return false;
    }

    $.ajax({
        url: form.attr('action'),
        type: "POST",
        data: {
            'new_password': newPassword,
            'password': password
        }
    }).done(function (xhr, textStatus, errorThrown) {
        toastr.success(messages.passwordChanged);
        e.target.reset();
    });
}

// -------------------------------------------
// Theme switcher
// -------------------------------------------
function switchThemeVariation() {
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
    }, 2000);

    $.ajax({
        url: '/scripts/preferences/togglethemevariation',
        type: "POST",
    }).fail(function () {
        clearTimeout(timeout);
    });
}
function toggleHideSidebar() {
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

    $.ajax({
        url: '/scripts/preferences/togglehidesidebar',
        type: "POST"
    });
}

// -------------------------------------------
// Localize dates and numbers
// -------------------------------------------
$('.datetime').localizeTimestamp();
$('.number').localizeNumber();
$('.currency').localizeCurrency();

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
            var content = loadingAnimation();
            if ($p(id).is('*')) {
                content = $p(id).html();
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
                    $.ajax({
                        url: '/scripts/posts/get',
                        type: "POST",
                        data: {'post_id': id}
                    }).done(function (data) {
                        // Update timestamps
                        data = $(data);
                        data.find('.datetime').localizeTimestamp(this);

                        instance.content(data);
                    }).fail(function() {
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
        if ($p(id).is('*')) {
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
// Mobile menu
// -------------------------------------------
function toggleSidebar() {
    $('#sidebar').toggleClass('visible');
}
$('#sidebar').click(function (e) {
    if (e.offsetX > $('#sidebar').innerWidth()) {
        toggleSidebar();
    }
});

$('body >:not(#topbar):not(#sidebar)').on('click', function (e) {
    $('#sidebar.visible').removeClass('visible');
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
// Post higlighting
// -------------------------------------------
function highlightPost(id) {
    $(id).addClass('highlighted');
}
function removeHighlights() {
    $('.highlighted').removeClass('highlighted');
}

// -------------------------------------------
// Window and body event bindings
// -------------------------------------------
$(window).on('beforeunload', function (e) {
    return confirmUnload(e);
}).on('hashchange load', function (e) {
    if (e.type == 'hashchange') {
        removeHighlights();
    }
    if (window.location.hash.length != 0) {
        highlightPost(window.location.hash);
        // Prevent posts going under the top bar
        // FIXME: Hacky... Causes slight page jumping. Not good.
        if ($('#topbar').is(':visible')) {
            var post = $(window.location.hash);
            $(window).scrollTop(post.offset().top - $('#topbar').height());
        }
    }
}).on('keydown', function (e) {
    // This brings down the server load quite a bit, as not everything is reloaded when pressing F5
    if (e.which == 116 && !e.ctrlKey) { // F5
        pageReload();
        return false;
    } else if (e.which == 82 && e.ctrlKey && !e.shiftKey) { // R
        pageReload();
        return false;
    }
});

// -------------------------------------------
// "Private" functions used by other functions
// -------------------------------------------
function pageReload() {
    window.location = window.location.href.split('#')[0];
}

function returnToBoard() {
    // Remove everything after the last slash and redirect
    // Should work if we are in a thread, otherwise not really
    var url = window.location.href;
    url = url.substr(0, url.lastIndexOf('/') + 1);

    window.location = url;
}

function ajaxError(xhr, textStatus, errorThrown) {
    var errorMessage = getErrorMessage(xhr, errorThrown);

    if (xhr.status == '418') {
        toastr.info(errorMessage);
    } else if (errorMessage.length != 0) {
        toastr.error(errorMessage, messages.errorOccurred);
    } else {
        toastr.error(messages.errorOccurred);
    }
}

function loadingAnimation(classes) {
    if (typeof classes == 'undefined') {
        classes = '';
    } else {
        classes += ' ';
    }

    return '<span class="' + classes + 'loading icon-loading spin"></span>';
}

function getSelectionText() {
    var text = '';
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function $t(id) {
    return $('#thread-' + id);
}

function $p(id) {
    return $('#post-' + id);
}

// -------------------------------------------
// Confirm page exit when there's text in the post form
// -------------------------------------------
function confirmUnload() {
    var textarea = $('#post-message');
    if (!submitInProgress && textarea.is(':visible') && textarea.val().length != 0) {
        return messages.confirmUnload;
    } else {
        e = null;
    }
}

// -------------------------------------------
// LocalStorage wrappers
// -------------------------------------------
$.localStorage = {
    store: function(key, val) {
        if (!this.isAvailable()) {
            return false;
        }

        return localStorage.setItem(key, val);
    },
    get: function(key) {
        if (!this.isAvailable()) {
            return false;
        }

        return localStorage.getItem(key);
    },
    remove: function(key) {
        if (!this.isAvailable()) {
            return false;
        }

        return localStorage.removeItem(key);
    },
    isAvailable: function() {
        if (typeof localStorage == 'undefined') {
            toastr.warning(messages.oldBrowserWarning);

            return false;
        }

        return true;
    }
};

// -------------------------------------------
// Modals
// -------------------------------------------
$.modal = {
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
                $.modal.close();
            }
        });
        this.$blocker.click(function (e) {
            if (e.target == this) {
                $.modal.close();
            }
        });

        this.$container = $('<div class="modal"><button class="modal-close"><span class="icon-cross2"></span></button></div>');
        this.$blocker.append(this.$container);
        this.$elm = $('<div class="modal-content"></div>');
        this.$container.append(this.$elm);
        this.$elm.html('<div class="modal-loading">' + loadingAnimation() + '</div>');

        var current = this.$elm;
        $.ajax({
            url: url,
            type: "POST",
            data: options.postData
        }).done(function (html) {
            current.html(html);
        }).fail(function () {
            $.modal.close();
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

$('body').on('click', '.modal-close', function() {
    $.modal.close();
});
