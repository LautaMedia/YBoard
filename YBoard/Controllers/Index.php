<?php
namespace YBoard\Controllers;

use YBoard\BaseController;

class Index extends BaseController
{
    public function index(): void
    {
        $view = $this->loadTemplateEngine();

        $view->display('Index');
    }
}
