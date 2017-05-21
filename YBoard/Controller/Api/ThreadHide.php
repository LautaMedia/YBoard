<?php
namespace YBoard\Controller\Api;

use YBoard\ApiController;
Use YBoard\Model;

class ThreadHide extends ApiController
{
    public function create(): void
    {
        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        if ($thread === null) {
            $this->throwJsonError(400, _('Thread does not exist'));
        }
        $thread->updateStats('hideCount');

        $this->user->threadHide->add($_POST['threadId']);
    }

    public function delete(): void
    {
        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        if ($thread === null) {
            $this->throwJsonError(400, _('Thread does not exist'));
        }
        $thread->updateStats('hideCount', -1);

        $this->user->threadHide->remove($_POST['threadId']);
    }
}
