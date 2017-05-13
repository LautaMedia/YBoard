class PostForm
{
    constructor()
    {
        this.elm = document.getElementById('post-form');
        this.location = document.getElementById('post-form').parentNode;
        this.msgElm = document.getElementById('post-message');
        this.fileUploadInProgress = false;
        this.fileUploadXhr = null;
        this.submitAfterFileUpload = false;
        this.submitInProgress = false;
        this.origDestName = false;
        this.origDestValue = false;
    }

    show(isReply)
    {
        if (!isReply) {
            // Reset if we click the "Create thread" -button
            this.reset();
        }

        this.elm.classList.add('visible');
        if (this.msgElm.offsetParent !== null) {
            this.msgElm.focus();
        }
    }

    hide()
    {
        this.elm.classList.remove('visible');
    }

    reset()
    {
        this.elm.reset();
        this.location.appendChild(this.elm);

        this.removeFile();
        this.resetDestination();
        this.hide();
    }

    focus()
    {
        this.msgElm.focus();
    }

    setDestination(isReply, destination)
    {
        this.storeDestination();
        var name = 'board';
        if (isReply) {
            name = 'thread';
        }
        this.elm.find('#post-destination').attr('name', name).val(destination);
    }

    storeDestination()
    {
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
    }

    resetDestination()
    {
        var destElm = this.elm.querySelector('#post-destination');
        var boardSelector = this.elm.querySelector('#label-board');

        // Restore board selector
        if (boardSelector !== null) {
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
    }

    insertBbCode(code)
    {
        this.msgElm.insertAtCaret('[' + code + ']', '[/' + code + ']');
    }

    toggleBbColorBar()
    {
        this.elm.getElementById('color-buttons').toggle();
        this.msgElm.focus();
    }

    uploadFile()
    {
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
            type: 'POST',
            processData: false,
            contentType: false,
            data: fd,
            xhr: function()
            {
                var xhr = $.ajaxSettings.xhr();
                if (!xhr.upload) {
                    return xhr;
                }
                xhr.upload.addEventListener('progress', function(evt)
                {
                    if (evt.lengthComputable) {
                        var percent = Math.round((evt.loaded / evt.total) * 100);
                        if (percent < 1) {
                            percent = 1;
                        } else {
                            if (percent > 95) {
                                percent = 95;
                            }
                        }
                        that.updateFileProgressBar(percent);
                    }
                }, false);
                return xhr;
            },
        }).always(function()
        {
            that.fileUploadInProgress = false;
        }).done(function(data)
        {
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
        }).fail(function()
        {
            that.updateFileProgressBar(0);
        });
    }

    removeFile()
    {
        this.elm.querySelector('#post-files').value = '';
        this.elm.querySelector('#file-id').value = '';
        this.elm.querySelector('#file-name').value = '';
        this.updateFileProgressBar(0);
        this.submitAfterFileUpload = false;

        if (this.fileUploadXhr !== null) {
            this.fileUploadXhr.abort();
        }
    }

    updateFileProgressBar(progress)
    {
        if (progress < 0) {
            progress = 0;
        } else {
            if (progress > 100) {
                progress = 100;
            }
        }

        var bar = this.elm.querySelector('.file-progress div');
        if (progress == 0) {
            bar.style.width = 0;
            bar.classList.remove('in-progress');
        } else {
            bar.style.width = progress + '%';
            bar.classList.add('in-progress');
        }
    }

    threadReply(threadId)
    {
        this.elm.appendTo(YB.thread.getElm(threadId).find('.thread-content'));
        this.show(true);

        this.setDestination(true, threadId);

        this.msgElm.focus();
    }

    postReply(postId)
    {
        var selectedText = YB.getSelectionText();

        this.elm.appendTo(YB.post.getElm(postId));
        this.show(true);

        this.setDestination(true, this.elm.closest('.thread').data('id'));

        this.msgElm.focus();
        var append = '';
        if (this.msgElm.val().substr(-1) == '\n') {
            append += '\n';
        } else {
            if (this.msgElm.val().length != 0) {
                append += '\n\n';
            }
        }
        append += '>>' + postId + '\n';

        // If any text on the page was selected, add it to post form with quotes
        if (selectedText != '') {
            append += '>' + selectedText.replace(/(\r\n|\n|\r)/g, '$1>') + '\n';
        }

        this.msgElm.val(this.msgElm.val().trim() + append);
    }

    submit(e)
    {
        if (typeof e != 'undefined') {
            e.preventDefault();
        }

        if (!('FormData' in window)) {
            toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
            return false;
        }

        var submitButton = this.elm.querySelector('input[type="submit"].button');

        // File upload in progress -> wait until done
        if (this.fileUploadInProgress) {
            submitButton.setAttribute('disabled', true);
            this.submitAfterFileUpload = true;
            return false;
        }

        // Prevent duplicate submissions by double clicking etc.
        if (this.submitInProgress) {
            return false;
        }
        this.submitInProgress = true;

        this.elm.querySelector('#post-files').value = '';

        var fd = new FormData(this.elm);

        var that = this;
        YQuery.post(this.elm.getAttribute('action'), fd).done(function(data)
        {
            var dest = $('#post-destination');
            var thread;
            if (dest.setAttribute('name') != 'thread') {
                thread = null;
            } else {
                thread = dest.val();
            }

            if (thread != null) {
                toastr.success(messages.postSent);
                YB.thread.ajaxUpdate.runOnce(thread);
            } else {
                if (data.length == 0) {
                    YB.pageReload();
                } else {
                    data = JSON.parse(data);
                    if (typeof data.message == 'undefined') {
                        toastr.error(messages.errorOccurred);
                    } else {
                        window.location = '/' + that.elm.find('[name="board"]').val() + '/' + data.message;
                    }
                }
            }

            // Reset post form
            that.reset();
        }).always(function()
        {
            submitButton.removeAttribute('disabled');
            that.submitInProgress = false;

            YB.captcha.reset();
        });
    }
}

export default PostForm;
