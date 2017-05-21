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

        // Remove highlighted posts when the location hash is changed
        document.addEventListener('hashchange', function()
        {
            that.removeHighlights();
        });
    }

    bindEvents(elm)
    {
        let that = this;
        this.File.bindEvents(elm);

        elm.querySelectorAll('.e-post-delete').forEach(function(elm)
        {
            elm.addEventListener('click', that.delete);
        });
    }

    getElm(id)
    {
        return document.getElementById('post-' + id);
    }

    delete(e)
    {
        let that = this;
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

    highlight(id)
    {
        this.getElm(id).classList.add('highlighted');
    }

    removeHighlights()
    {
        document.getElementsByClassName('highlighted').forEach(function(elm)
        {
            elm.classList.remove('highlighted');
        });
    }
}

export default Post;
