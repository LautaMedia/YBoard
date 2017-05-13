import YBoard from '../../YBoard';

class Hide {
    add(id)
    {
        YBoard.Thread.getElm(id).hide();
        $.post('/scripts/threads/hide', {'threadId': id}).onError(function()
        {
            YBoard.Thread.getElm(id).show();
        });
    }

    remove(id)
    {
        YBoard.Thread.getElm(id).show();
        YQuery.post('/scripts/threads/restore', {'threadId': id}).onError(function()
        {
            YBoard.Thread.getElm(id).hide();
        });
    }
}

export default Hide;
