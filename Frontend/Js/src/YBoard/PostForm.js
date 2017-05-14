import YQuery from '../YQuery';
import YBoard from '../YBoard';

class PostForm
{
    constructor()
    {
        let that = this;
        this.elm = document.getElementById('post-form');
        if (this.elm === null) {
            return;
        }

        this.locationParent = this.elm.parentNode;
        this.location = this.elm.nextElementSibling;
        this.msgElm = this.elm.querySelector('#post-message');
        this.fileUploadInProgress = false;
        this.fileUploadXhr = null;
        this.submitAfterFileUpload = false;
        this.submitInProgress = false;
        this.origDestName = false;
        this.origDestValue = false;

        // BBCode buttons
        this.elm.querySelectorAll('.bb-code').forEach(function(elm)
        {
            elm.addEventListener('click', function(e)
            {
                that.insertBbCode(e.target.dataset.code);
            });
        });
        this.elm.querySelector('.bb-color-bar').addEventListener('click', function()
        {
            that.toggleBbColorBar();
        });

        // Confirm page exit when there's text in the post form
        document.addEventListener('beforeunload', function(e)
        {
            if (!that.submitInProgress && that.msgElm.offsetParent !== null && that.msgElm.value.length !== 0) {
                return messages.confirmUnload;
            } else {
                e = null;
            }
        });

        // Reply to a post
        document.querySelectorAll('.add-post-reply').forEach(function(elm)
        {
            elm.addEventListener('click', function(e)
            {
                e.preventDefault();
                that.postReply(e.target.closest('.post').dataset.id);
                that.msgElm.focus();
            });
        });

        // Create thread
        document.querySelectorAll('.create-thread').forEach(function(elm)
        {
            elm.addEventListener('click', function()
            {
                that.show();
            });
        });

        // Reply to a thread
        document.querySelectorAll('.add-reply').forEach(function(elm)
        {
            elm.addEventListener('click', function(e)
            {
                that.threadReply(e.target.closest('.thread').dataset.id);
                that.msgElm.focus();
            });
        });

        // Cancel post
        this.elm.querySelector('#reset-button').addEventListener('click', function(e)
        {
            e.preventDefault();
            that.reset();
        });

        // Upload file after change
        this.elm.querySelector('#post-files').addEventListener('change', function()
        {
            that.uploadFile();
        });

        // Remove file -button
        this.elm.querySelector('#remove-file').addEventListener('click', function()
        {
            that.removeFile();
        });

        // Toggle post options
        this.elm.querySelector('.toggle-options').addEventListener('click', function(e)
        {
            e.preventDefault();
            document.getElementById('post-options').toggle();
        });

        // Submit a post
        this.elm.addEventListener('submit', function(e)
        {
            that.submit(e);
        });
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
        if (this.location !== null) {
            this.locationParent.insertBefore(this.elm, this.location);
        } else {
            this.locationParent.appendChild(this.elm);
        }

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
        this.saveDestination();
        let name = 'board';

        if (isReply) {
            name = 'thread';
        }

        let postDestination = this.elm.querySelector('#post-destination');
        postDestination.setAttribute('name', name);
        postDestination.value = destination;
    }

    saveDestination()
    {
        let destElm = this.elm.querySelector('#post-destination');
        let boardSelector = this.elm.querySelector('#label-board');

        // Hide board selector
        if (boardSelector !== null) {
            boardSelector.hide();
            boardSelector.querySelector('select').required = false;
            return true;
        }

        if (this.origDestName) {
            return true;
        }

        this.origDestName = destElm.getAttribute('name');
        this.origDestValue = destElm.value;

        return true;
    }

    resetDestination()
    {
        let destElm = this.elm.querySelector('#post-destination');
        let boardSelector = this.elm.querySelector('#label-board');

        // Restore board selector
        if (boardSelector !== null) {
            boardSelector.show('flex');
            boardSelector.querySelector('select').required = true;
        }

        if (!this.origDestName) {
            return true;
        }

        destElm.setAttribute('name', this.origDestName);
        destElm.value = this.origDestValue;

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
        this.elm.querySelector('#color-buttons').toggle();
        this.msgElm.focus();
    }

    uploadFile()
    {
        let fileInput = this.elm.querySelector('#post-files');
        let fileNameElm = this.elm.querySelector('#file-name');

        fileNameElm.value = '';
        this.submitAfterFileUpload = false;

        // Abort any ongoing uploads
        if (this.fileUploadXhr !== null) {
            this.fileUploadXhr.abort();
        }

        this.updateFileProgressBar(1);

        // Calculate upload size and check it does not exceed the set maximum
        let maxSize = fileInput.dataset.maxsize;
        let fileList = fileInput.files;
        let fileSizeSum = 0;
        for (let i = 0, file; file = fileList[i]; i++) {
            fileSizeSum += file.size;
        }

        if (fileSizeSum > maxSize) {
            YBoard.Toast.warning(messages.maxSizeExceeded);
            this.updateFileProgressBar(0);
            return false;
        }

        let fd = new FormData();
        Array.from(fileList).forEach(file => {
            fd.append('file', file);
        });

        this.fileUploadInProgress = true;

        let fileName = fileInput.value.split('\\').pop().split('.');
        fileName.pop();
        fileNameElm.value = fileName.join('.');

        let that = this;
        let fileUpload = YQuery.post('/api/files/upload', fd, {
            contentType: null,
            xhr: function(xhr) {
                if (!xhr.upload) {
                    return xhr;
                }
                xhr.upload.addEventListener('progress', function(evt) {
                    console.log(evt);
                    if (evt.lengthComputable) {
                        let percent = Math.round((evt.loaded / evt.total) * 100);
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
            }
        }).onEnd(function() {
            that.fileUploadInProgress = false;
        }).onLoad(function(data) {
            that.updateFileProgressBar(100);
            data = JSON.parse(data);
            if (data.message.length !== 0) {
                that.elm.querySelector('#file-id').value = data.message;

                if (that.submitAfterFileUpload) {
                    this.submit();
                }
            } else {
                YBoard.Toast.error(messages.errorOccurred);
                that.updateFileProgressBar(0);
            }
        }).onError(function() {
            that.updateFileProgressBar(0);
        });

        this.fileUploadXhr = fileUpload.getXhrObject();
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

        let bar = this.elm.querySelector('.file-progress div');
        if (progress === 0) {
            bar.style.width = 0;
            bar.classList.remove('in-progress');
        } else {
            bar.style.width = progress + '%';
            bar.classList.add('in-progress');
        }
    }

    threadReply(threadId)
    {
        YBoard.Thread.getElm(threadId).querySelector('.thread-content').appendChild(this.elm);
        this.show(true);
        this.setDestination(true, threadId);
        this.msgElm.focus();
    }

    postReply(postId)
    {
        let selectedText = YBoard.getSelectionText();

        this.elm.appendChild(YBoard.Post.getElm(postId));
        this.show(true);

        this.setDestination(true, this.elm.closest('.thread').data('id'));

        this.msgElm.focus();
        let append = '';
        if (this.msgElm.value.substr(-1) === '\n') {
            append += '\n';
        } else {
            if (this.msgElm.value.length !== 0) {
                append += '\n\n';
            }
        }
        append += '>>' + postId + '\n';

        // If any text on the page was selected, add it to post form with quotes
        if (selectedText !== '') {
            append += '>' + selectedText.replace(/(\r\n|\n|\r)/g, '$1>') + '\n';
        }

        this.msgElm.value = this.msgElm.value.trim() + append;
    }

    submit(e)
    {
        let that = this;
        if (typeof e === 'object') {
            e.preventDefault();
        }

        // Prevent duplicate submissions by double clicking etc.
        if (this.submitInProgress) {
            return false;
        }
        this.submitInProgress = true;

        let submitButton = this.elm.querySelector('input[type="submit"].button');

        // File upload in progress -> wait until done
        if (this.fileUploadInProgress) {
            submitButton.disabled = true;
            this.submitAfterFileUpload = true;
            return false;
        }

        this.elm.querySelector('#post-files').value = '';

        let fd = new FormData(this.elm);

        if (typeof window.captchaResponse === 'string') {
            fd.append('captchaResponse', window.captchaResponse);
            delete window.captchaResponse;
        }

        YQuery.post(this.elm.getAttribute('action'), fd).onLoad(function(data)
        {
            let dest = document.getElementById('post-destination');
            let thread;
            if (dest.getAttribute('name') !== 'thread') {
                thread = null;
            } else {
                thread = dest.value;
            }

            if (thread !== null) {
                YBoard.Toast.success(messages.postSent);
                YBoard.Thread.AutoUpdate.runOnce(thread);
            } else {
                if (data.length === 0) {
                    YBoard.pageReload();
                } else {
                    data = JSON.parse(data);
                    if (typeof data.message === 'undefined') {
                        YBoard.Toast.error(messages.errorOccurred);
                    } else {
                        window.location = '/' + that.elm.querySelector('[name="board"]').value + '/' + data.message;
                    }
                }
            }

            // Reset post form
            that.reset();
        }).onEnd(function()
        {
            submitButton.disabled = false;
            that.submitInProgress = false;

            YBoard.Captcha.reset();
        });
    }
}

export default PostForm;
