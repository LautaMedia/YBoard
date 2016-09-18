<?php
namespace YBoard\Controller;

use YBoard\Abstracts\ExtendedController;

class GoldAccount extends ExtendedController
{
    public function index()
    {
        $this->jsonMessage(json_encode([$_POST, $_SERVER["SERVER_PROTOCOL"]]));
        die();
        $view = $this->loadTemplateEngine();
        $view->pageTitle = _('Gold account');

        $view->display('Gold');
    }
}
