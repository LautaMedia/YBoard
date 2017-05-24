import YQuery from '../YQuery';
import YBoard from '../YBoard';
import Toast from '../Toast';
import PostFile from './Post/File';

class Post
{
    constructor()
    {
        this.File = new PostFile();
    }

    bindEvents(elm)
    {
        let that = this;
        this.File.bindEvents(elm);

        elm.querySelectorAll('.e-post-delete').forEach(function(elm)
        {
            elm.addEventListener('click', that.delete);
        });

        elm.querySelectorAll('.ref').forEach(function(elm)
        {
            elm.addEventListener('click', that.refClick);
        });
    }

    truncateLongPosts(elm)
    {
        elm.querySelectorAll('.message').forEach(function(elm) {
            if (elm.clientHeight > 600) {
                elm.classList.add('truncated');
                let button = document.createElement('button');
                button.addEventListener('click', function(e) {
                    elm.classList.remove('truncated');
                    button.remove();
                });
                button.classList.add('button');
                button.innerHTML = 'Show full message';
                elm.parentNode.insertBefore(button, elm.nextSibling);
            }
        });
    }

    refClick(e)
    {
        let referred = e.currentTarget.dataset.id;
        if (typeof referred === 'undefined') {
            return true;
        }

        if (document.getElementById('post-' + referred) !== null) {
            e.preventDefault();
            document.location.hash = '#post-' + referred;
        }
    }

    getElm(id)
    {
        return document.getElementById('post-' + id);
    }

    delete(e)
    {
        if (!confirm(messages.confirmDeletePost)) {
            return false;
        }

        let post = e.target.closest('.post');
        let id = post.dataset.id;
        YQuery.post('/api/post/delete', {'postId': id}).onLoad(function()
        {
            post.remove();
            if (document.body.classList.contains('thread-page')) {
                if (YBoard.Thread.getElm(id) !== null) {
                    // We're in the thread we just deleted
                    YBoard.returnToBoard();
                }
            } else {
                // The deleted post is not the current thread
                YBoard.Thread.getElm(id).remove();
                Toast.success(messages.postDeleted);
            }
        });
    }
}

export default Post;
