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
        if ($thread === null) {
            // Does not exist. Was it deleted?
            $deleted = Model\Post::getDeleted($this->db, $threadId);
            if (!$deleted) {
                $this->notFound(null, _('The thread you are looking for does not exist.'));
            } else {
                $this->gone();
            }
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
}
