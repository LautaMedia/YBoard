<?php
namespace YBoard\Controllers;

use YBoard\BaseController;
use YBoard\Models\Post;

class ThreadFollow extends BaseController
{
    public function add()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['thread_id'])) {
            $this->throwJsonError(400);
        }

        $posts = new Post($this->db);
        $thread = $posts->getThread($_POST['thread_id'], false);
        $thread->updateStats('followCount');

        $followedThread = $this->user->threadFollow->get($_POST['thread_id']);
        if ($followedThread === false) {
            $this->user->threadFollow->add($_POST['thread_id']);
        }
    }

    public function remove()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['thread_id'])) {
            $this->throwJsonError(400);
        }

        $posts = new Post($this->db);
        $thread = $posts->getThread($_POST['thread_id'], false);
        $thread->updateStats('followCount', -1);

        $followedThread = $this->user->threadFollow->get($_POST['thread_id']);
        if ($followedThread !== false) {
            $followedThread->remove();
        }
    }

    public function markAllRead()
    {
        $this->validateAjaxCsrfToken();

        $this->user->threadFollow->markAllRead();
    }
}
