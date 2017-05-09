<?php
namespace YBoard\Controllers;

use YBoard\BaseController;

class Index extends BaseController
{
    public function index()
    {
        $view = $this->loadTemplateEngine();

        $view->display('Index');
    }
}
