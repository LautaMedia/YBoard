<?php
namespace YBoard\Controller;

use YBoard\Controller;
use YBoard\Model;

class CustomBoard extends Controller
{
    public function myThreads(int $pageNum = 1): void
    {
        Model\Thread::setHidden($this->user->threadHide->getAll());
        $threads = Model\Thread::getIdsByUser($this->db, $this->user->id,
            $this->user->preferences->threadsPerPage * $this->config['view']['maxPages']);
        $threads = Model\Thread::getCustom($this->db, $threads, $pageNum, $this->user->preferences->threadsPerPage,
            $this->user->preferences->repliesPerThread);

        $this->showCustomBoard($threads, 'mythreads', (int)$pageNum);
    }

    public function repliedThreads(int $pageNum = 1): void
    {
        Model\Thread::setHidden($this->user->threadHide->getAll());
        $threads = Model\Thread::getIdsRepliedByUser($this->db, $this->user->id,
            $this->user->preferences->threadsPerPage * $this->config['view']['maxPages']);
        $threads = Model\Thread::getCustom($this->db, $threads, $pageNum, $this->user->preferences->threadsPerPage,
            $this->user->preferences->repliesPerThread);

        $this->showCustomBoard($threads, 'repliedthreads', (int)$pageNum);
    }

    public function followedThreads(int $pageNum = 1): void
    {
        $threads = Model\Thread::getCustom($this->db, array_keys($this->user->threadFollow->getAll()), $pageNum,
            $this->user->preferences->threadsPerPage, $this->user->preferences->repliesPerThread, true);

        $this->showCustomBoard($threads, 'followedthreads', (int)$pageNum);
    }

    public function hiddenThreads(int $pageNum = 1): void
    {
        $threads = Model\Thread::getCustom($this->db, $this->user->threadHide->getAll(), $pageNum,
            $this->user->preferences->threadsPerPage, $this->user->preferences->repliesPerThread);

        $this->showCustomBoard($threads, 'hiddenthreads', (int)$pageNum);
    }

    public function myThreadsCatalog(int $pageNum = 1): void
    {
        Model\Thread::setHidden($this->user->threadHide->getAll());
        $threads = Model\Thread::getIdsByUser($this->db, $this->user->id,
            $this->user->preferences->threadsPerCatalogPage * $this->config['view']['maxCatalogPages']);
        $threads = Model\Thread::getCustomThreads($this->db, $threads, $pageNum, $this->user->preferences->threadsPerCatalogPage);

        $this->showCustomBoard($threads, 'mythreads', (int)$pageNum, true);
    }

    public function repliedThreadsCatalog(int $pageNum = 1): void
    {
        Model\Thread::setHidden($this->user->threadHide->getAll());
        $threads = Model\Thread::getIdsRepliedByUser($this->db, $this->user->id,
            $this->user->preferences->threadsPerCatalogPage * $this->config['view']['maxCatalogPages']);
        $threads = Model\Thread::getCustom($this->db, $threads, $pageNum, $this->user->preferences->threadsPerCatalogPage);

        $this->showCustomBoard($threads, 'repliedthreads', (int)$pageNum, true);
    }

    public function followedThreadsCatalog(int $pageNum = 1): void
    {
        $threads = Model\Thread::getCustom($this->db, array_keys($this->user->threadFollow->getAll()), $pageNum,
            $this->user->preferences->threadsPerCatalogPage);

        $this->showCustomBoard($threads, 'followedthreads', (int)$pageNum, true);
    }

    public function hiddenThreadsCatalog(int $pageNum = 1): void
    {
        $threads = Model\Thread::getCustom($this->db, $this->user->threadHide->getAll(), $pageNum,
            $this->user->preferences->threadsPerCatalogPage);

        $this->showCustomBoard($threads, 'hiddenthreads', (int)$pageNum, true);
    }

    protected function showCustomBoard(array $threads, string $boardName, int $pageNum, bool $catalog = false): void
    {
        if (!$catalog) {
            $maxPages = $this->config['view']['maxPages'];
            $bodyClass = 'board-page';
            $viewFile = 'Board';
            $paginationBase = '';
            $isLastPage = count($threads) < $this->user->preferences->threadsPerPage;
        } else {
            $maxPages = $this->config['view']['maxCatalogPages'];
            $bodyClass = 'board-catalog';
            $viewFile = 'BoardCatalog';
            $paginationBase = '/catalog';
            $isLastPage = count($threads) < $this->user->preferences->threadsPerCatalogPage;
        }

        $this->limitPages($pageNum, $maxPages);

        $view = $this->loadTemplateEngine();
        $board = $this->getCustomBoard($boardName);

        $view->setVar('pageTitle', $board->name);
        $view->setVar('bodyClass', $bodyClass);

        $this->initializePagination($view, $pageNum, $maxPages, $isLastPage, $paginationBase);

        $view->setVar('board', $board);
        $view->setVar('threads', $threads);
        $view->setVar('pageNum', $pageNum);

        $view->display($viewFile);
    }

    protected function getCustomBoard(string $name): Model\Board
    {
        $board = new Model\Board($this->db);
        $board->url = $name;
        switch ($name) {
            case 'mythreads':
                $board->name = _('My threads');
                $board->description = _('All the great threads you have created');
                break;
            case 'repliedthreads':
                $board->name = _('Replied threads');
                $board->description = _('Threads that may even have some interesting content');
                break;
            case 'followedthreads':
                $board->name = _('Followed threads');
                $board->description = _('Threads you have marked as interesting');
                break;
            case 'hiddenthreads':
                $board->name = _('Hidden threads');
                $board->description = _('Why are you even reading these?');
                break;
        }

        return $board;
    }
}
