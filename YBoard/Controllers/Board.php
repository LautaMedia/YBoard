<?php
namespace YBoard\Controllers;

use YBoard\BaseController;
use YBoard\Models\Posts;
use YFW\Library\HttpResponse;

class Board extends BaseController
{
    public function index($boardUrl, $pageNum = 1)
    {
        $this->verifyBoard($boardUrl);
        $this->limitPages($pageNum, $this->config['view']['maxPages']);

        $posts = new Posts($this->db);
        $posts->setHiddenThreads($this->user->threadHide->getAll());

        $board = $this->boards->getByUrl($boardUrl);
        $threads = $posts->getBoardThreads($board->id, $pageNum, $this->user->preferences->threadsPerPage,
            $this->user->preferences->repliesPerThread);

        $isLastPage = count($threads) < $this->user->preferences->threadsPerPage;

        $view = $this->loadTemplateEngine();

        $view->setVar('pageTitle', $board->name);
        $view->setVar('bodyClass', 'board-page');
        $view->setVar('threads', $threads);

        $this->initializePagination($view, $pageNum, $this->config['view']['maxPages'], $isLastPage);

        $view->setVar('board', $board);
        $view->setVar('pageNum', $pageNum);
        $view->display('Board');
    }

    public function catalog($boardUrl, $pageNum = 1)
    {
        $this->verifyBoard($boardUrl);
        $this->limitPages($pageNum, $this->config['view']['maxCatalogPages']);

        $posts = new Posts($this->db);
        $posts->setHiddenThreads($this->user->threadHide->getAll());

        $board = $this->boards->getByUrl($boardUrl);
        $threads = $posts->getBoardThreads($board->id, $pageNum, $this->user->preferences->threadsPerCatalogPage);

        $isLastPage = count($threads) < $this->user->preferences->threadsPerCatalogPage;

        $view = $this->loadTemplateEngine();

        $view->pageTitle = $board->name;
        $view->bodyClass = 'board-catalog';

        $this->initializePagination($view, $pageNum, $this->config['view']['maxCatalogPages'], $isLastPage, '/catalog');

        $view->board = $board;
        $view->threads = $threads;
        $view->pageNum = $pageNum;
        $view->display('BoardCatalog');
    }

    public function redirect(string $boardUrl, int $boardPage = 1, string $catalog = '', int $catalogPage = 1)
    {
        // Verify board exists
        $redirTo = false;
        if ($this->boards->exists($boardUrl)) {
            $redirTo = $this->boards->getByUrl($boardUrl)->url;
        } elseif ($this->boards->isAltUrl($boardUrl)) {
            $redirTo = $this->boards->getUrlByAltUrl($boardUrl);
        }

        if (!empty($catalog)) {
            $redirTo .= '/catalog';
        }

        if ($redirTo) {
            HttpResponse::redirectExit('/' . $redirTo . '/', 302);
        }

        $this->notFound();
    }

    protected function verifyBoard($boardUrl)
    {
        if (!$this->boards->exists($boardUrl)) {
            if ($this->boards->isAltUrl($boardUrl)) {
                HttpResponse::redirectExit('/' . $this->boards->getUrlByAltUrl($boardUrl) . '/', 302);
            }
            // Board does not exist and no alt_url match
            $this->notFound(_('Not found'),
                sprintf(_('There\'s no such thing as a board called "%s" here.'), $boardUrl));
        }
    }
}
