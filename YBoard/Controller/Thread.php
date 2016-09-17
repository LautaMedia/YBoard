<?php
namespace YBoard\Controller;

use YBoard\Abstracts\ExtendedController;
use YBoard\Library\Cache;
use YBoard\Library\HttpResponse;
use YBoard\Model\Posts;

class Thread extends ExtendedController
{
    public function index($boardUrl, $threadId)
    {
        $posts = new Posts($this->db);

        // Get thread
        $thread = $posts->getThread($threadId);
        if ($thread === false) {
            $this->notFound(_('Not found'), _('The thread you are looking for does not exist.'));
        }

        // Get board
        $board = $this->boards->getById($thread->boardId);
        if ($boardUrl != $board->url) {
            // Invalid board for current thread, redirect
            HttpResponse::redirectExit('/' . $board->url . '/' . $thread->id);
        }

        // Clear unread count and update last seen reply
        $followedThread = $this->user->threadFollow->get($thread->id);
        if ($followedThread !== false) {
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
        $view->pageTitle = $thread->subject;
        $view->bodyClass = 'thread-page';

        $view->board = $board;
        $view->thread = $thread;

        $view->display('Thread');
    }

    public function getReplies()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['threadId']) || !isset($_POST['fromId'])) {
            $this->throwJsonError(400);
        }

        $newest = empty($_POST['newest']) ? false : true;

        $posts = new Posts($this->db);
        $thread = $posts->getThread($_POST['threadId'], false);
        if ($thread === false) {
            $this->throwJsonError(404, _('Thread does not exist'));
        }

        $view = $this->loadTemplateEngine('Blank');

        $view->thread = $thread;
        $view->board = $this->boards->getById($thread->boardId);
        $view->replies = $thread->getReplies(null, $newest, $_POST['fromId']);

        $view->display('Ajax/ThreadExpand');

        // Clear unread count and update last seen reply
        $followedThread = $this->user->threadFollow->get($_POST['threadId']);
        if ($followedThread !== false) {
            $followedThread->resetUnreadCount();
            $followedThread->setLastSeenReply($_POST['fromId']);
        }
    }

    public function hide()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $posts = new Posts($this->db);
        $thread = $posts->getThread($_POST['threadId'], false);
        $thread->updateStats('hideCount');

        $this->user->threadHide->add($_POST['threadId']);
    }

    public function restore()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $posts = new Posts($this->db);
        $thread = $posts->getThread($_POST['threadId'], false);
        $thread->updateStats('hideCount', -1);

        $this->user->threadHide->remove($_POST['threadId']);
    }

    public function lock()
    {
        $this->updateThread('lock', true);
    }

    public function unlock()
    {
        $this->updateThread('lock', false);
    }

    public function stick()
    {
        $this->updateThread('stick', true);
    }

    public function unstick()
    {
        $this->updateThread('stick', false);
    }

    protected function updateThread(string $do, bool $bool)
    {
        $this->modOnly();
        $this->validateAjaxCsrfToken();

        if (empty($_POST['threadId'])) {
            $this->throwJsonError(400);
        }

        $posts = new Posts($this->db);
        $thread = $posts->getThread($_POST['threadId'], false);

        if ($do == 'stick') {
            if ($bool) {
                $thread->setSticky(true);
            } else {
                $thread->setSticky(false);
            }
        } elseif ($do == 'lock') {

            if ($bool) {
                $thread->setLocked(true);
            } else {
                $thread->setLocked(false);
            }
        }
    }
}
