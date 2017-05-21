<?php
namespace YBoard\Controller\Api;

use YBoard\ApiController;
Use YBoard\Model;

class Thread extends ApiController
{
    public function getReplies(): void
    {
        if (empty($_POST['threadId']) || !isset($_POST['fromId'])) {
            $this->throwJsonError(400);
        }

        $newest = empty($_POST['newest']) ? false : true;
        $count = empty($_POST['count']) ? 100 : (int)$_POST['count'];

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        if ($thread === null) {
            $this->throwJsonError(404, _('Thread does not exist'));
        }

        $view = $this->loadTemplateEngine('Blank');

        $view->setVar('thread', $thread);
        $view->setVar('board', Model\Board::getById($this->db, $thread->boardId));
        $view->setVar('replies', $thread->getReplies($count, $newest, $_POST['fromId']));

        $view->display('Ajax/ThreadExpand');

        // Clear unread count and update last seen reply
        $followedThread = $this->user->threadFollow->get($_POST['threadId']);
        if ($followedThread !== null) {
            $followedThread->resetUnreadCount();
            $followedThread->setLastSeenReply($_POST['fromId']);
        }
    }

    public function hide(): void
    {
        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        $thread->updateStats('hideCount');

        $this->user->threadHide->add($_POST['threadId']);
    }

    public function restore(): void
    {
        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        $thread->updateStats('hideCount', -1);

        $this->user->threadHide->remove($_POST['threadId']);
    }

    public function lock(): void
    {
        $this->update('lock', true);
    }

    public function unlock(): void
    {
        $this->update('lock', false);
    }

    public function stick(): void
    {
        $this->update('stick', true);
    }

    public function unstick(): void
    {
        $this->update('stick', false);
    }

    protected function update(string $do, bool $bool): bool
    {
        $this->modOnly();

        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        if (!$thread) {
            $this->throwJsonError(404, _('Thread not found'));
        }

        if ($do == 'stick') {
            if ($bool) {
                return $thread->setSticky(true);
            } else {
                return $thread->setSticky(false);
            }
        } elseif ($do == 'lock') {
            if ($bool) {
                return $thread->setLocked(true);
            } else {
                return $thread->setLocked(false);
            }
        }

        return false;
    }
}
