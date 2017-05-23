import YQuery from '../YQuery';
import YBoard from '../YBoard';
import Toast from '../Toast';
import PostFile from './Post/File';

class Post
{
    constructor()
    {
        let that = this;
        this.File = new PostFile();

        if (window.location.hash.substr(0, 6) === '#post-') {
            let post = document.getElementById('post-' + window.location.hash.substr(6));
            post.classList.add('highlighted');
        }
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

    refClick(e)
    {
        let referred = e.currentTarget.dataset.id;
        if (typeof referred === 'undefined') {
            return true;
        }

        if (document.getElementById('post-' + referred) !== null) {
            e.preventDefault();
            document.location.hash = '#post-' + referred;

            // Highlight post
            document.querySelectorAll('.highlighted').forEach(function(elm) {
                elm.classList.remove('highlighted');
            });
            document.getElementById('post-' + referred).classList.add('highlighted');
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
