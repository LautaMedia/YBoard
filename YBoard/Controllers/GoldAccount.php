<?php
namespace YBoard\Controllers;

use YBoard\BaseController;

class GoldAccount extends BaseController
{
    public function index(): void
    {
        $this->jsonMessage(json_encode([$_POST, $_SERVER["SERVER_PROTOCOL"]]));
        die();
        $view = $this->loadTemplateEngine();
        $view->pageTitle = _('Gold account');

        $view->display('Gold');
    }
}
