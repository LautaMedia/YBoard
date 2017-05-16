<?php
namespace YBoard\Controller;

use YBoard\Controller;
use YBoard\Model;
use YFW\Library\Cache;
use YFW\Library\HttpResponse;

class Thread extends Controller
{
    public function index(string $boardUrl, int $threadId): void
    {
        // Get thread
        $thread = Model\Thread::get($this->db, $threadId);
        if ($thread === false) {
            $this->notFound(_('Not found'), _('The thread you are looking for does not exist.'));
        }

        // Get board
        $board = Model\Board::getById($this->db, $thread->boardId);
        if ($boardUrl != $board->url) {
            // Invalid board for current thread, redirect
            HttpResponse::redirectExit('/' . $board->url . '/' . $thread->id);
        }

        // Clear unread count and update last seen reply
        $followedThread = $this->user->threadFollow->get($thread->id);
        if ($followedThread !== null) {
            if (!empty($thread->threadReplies)) {
                $tmp = array_slice($thread->threadReplies, -1);
                $lastReply = array_pop($tmp);
                $followedThread->setLastSeenReply($lastReply->id);
            }
            $followedThread->resetUnreadCount();
        }

        // Increment thread views
        $viewCacheKey = 'thread-view-' . $thread->id . '-' . $_SERVER['REMOTE_ADDR'];
        if (!Cache::exists($viewCacheKey)) {
            Cache::add($viewCacheKey, 1, 300);
            $thread->updateStats('readCount');
        }

        $view = $this->loadTemplateEngine();
        $view->setVar('pageTitle', $thread->subject);
        $view->setVar('bodyClass', 'thread-page');
        $view->setVar('board', $board);
        $view->setVar('thread', $thread);

        $view->display('Thread');
    }

    public function getReplies(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['threadId']) || !isset($_POST['fromId'])) {
            $this->throwJsonError(400);
        }

        $newest = empty($_POST['newest']) ? false : true;

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        if ($thread === false) {
            $this->throwJsonError(404, _('Thread does not exist'));
        }

        $view = $this->loadTemplateEngine('Blank');

        $view->setVar('thread', $thread);
        $view->setVar('board', Model\Board::getById($this->db, $thread->boardId));
        $view->setVar('replies', $thread->getReplies(null, $newest, $_POST['fromId']));

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
        $this->validateAjaxCsrfToken();

        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $thread = Model\Thread::get($this->db, $_POST['threadId'], false);
        $thread->updateStats('hideCount');

        $this->user->threadHide->add($_POST['threadId']);
    }

    public function restore(): void
    {
        $this->validateAjaxCsrfToken();

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
        $this->validateAjaxCsrfToken();

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
