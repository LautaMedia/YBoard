<?php
namespace YBoard\Controllers;

use YBoard\BaseController;

class Search extends BaseController
{
    public function index(): void
    {
        $view = $this->loadTemplateEngine();

        $view->pageTitle = _('Search');

        $view->display('Search');
    }
}
