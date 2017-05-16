<?php
namespace YBoard\Controllers;

use YBoard\BaseController;

class Preferences extends BaseController
{
    public function index(): void
    {
        $view = $this->loadTemplateEngine();

        $view->pageTitle = _('Preferences');
        $view->display('Preferences');
    }

    public function save(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['set']) || !is_array($_POST['set'])) {
            $this->throwJsonError(400);
        }

        foreach ($_POST['set'] as $key => $val) {
            $this->user->preferences->set($key, $val);
        }
    }

    public function toggleThemeVariation(): void
    {
        $this->validateAjaxCsrfToken();
        $this->user->preferences->set('themeAlt', !$this->user->preferences->themeAlt);
    }

    public function toggleSidebar(): void
    {
        $this->validateAjaxCsrfToken();
        $this->user->preferences->set('hideSidebar', !$this->user->preferences->hideSidebar);
    }
}
