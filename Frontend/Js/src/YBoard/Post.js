import YQuery from '../YQuery';
import YBoard from '../YBoard';
import PostFile from './Post/File';

class Post
{
    constructor()
    {
        this.file = new PostFile();
    }

    getElm(id)
    {
        return document.getElementById('post-' + id);
    }

    delete(id)
    {
        if (!confirm(messages.confirmDeletePost)) {
            return false;
        }

        let that = this;
        YQuery.post('/scripts/posts/delete', {'postId': id}, {
            'loadFunction': function()
            {
                that.getElm(id).remove();
                if ($('body').hasClass('thread-page')) {
                    if (YB.thread.getElm(id).is('*')) {
                        // We're in the thread we just deleted
                        YB.returnToBoard();
                    }
                } else {
                    // The deleted post is not the current thread
                    YBoard.thread.getElm(id).remove();
                    YBoard.Toast.success(messages.postDeleted);
                }
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
