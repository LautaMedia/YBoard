<?php
namespace YBoard\Controllers;

use YBoard\BaseController;

class InfoPages extends BaseController
{
    public function faq(): void
    {
        $view = $this->loadTemplateEngine();

        $view->pageTitle = _('FAQ');

        $view->display('InfoPages/FAQ');
    }

    public function rules(): void
    {
        $view = $this->loadTemplateEngine();

        $view->pageTitle = _('Rules');

        $view->display('InfoPages/Rules');
    }

    public function about(): void
    {
        $view = $this->loadTemplateEngine();

        $view->pageTitle = _('About');

        $view->display('InfoPages/About');
    }

    public function advertising(): void
    {
        $view = $this->loadTemplateEngine();

        $view->pageTitle = _('Advertising');

        $view->display('InfoPages/Advertising');
    }
}
