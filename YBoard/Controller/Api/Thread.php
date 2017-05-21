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
            $this->throwJsonError(400, _('Thread does not exist'));
        }

        $view = $this->loadTemplateEngine('Blank');

        $view->setVar('thread', $thread);
        $view->setVar('board', Model\Board::getById($this->db, $thread->boardId));
        $view->setVar('replies', $thread->getReplies($count, $newest, $_POST['fromId']));

        $view->display('Ajax/ThreadExpand');

        // Clear unread count and update last seen reply
        $followedThread = $this->user->getFollowedThread($_POST['threadId']);
        if ($followedThread !== null) {
            $followedThread->resetUnreadCount();
            $followedThread->setLastSeenReply($_POST['fromId']);
        }
    }
    protected function update(string $do, bool $bool): bool
    {
        $this->modOnly();

        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        if (!$thread) {
            $this->throwJsonError(400, _('Thread does not exist'));
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
