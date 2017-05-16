<?php
namespace YBoard\Controller;

use YBoard\Controller;

class GoldAccount extends Controller
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
