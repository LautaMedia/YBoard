<?php
namespace YBoard\Controller;

use YBoard\Abstracts\ExtendedController;

class Preferences extends ExtendedController
{
    public function index()
    {
        $view = $this->loadTemplateEngine();

        $view->pageTitle = _('Preferences');
        $view->display('Preferences');
    }

    public function save()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['set']) || !is_array($_POST['set'])) {
            $this->throwJsonError(400);
        }

        foreach ($_POST['set'] as $key => $val) {
            $this->user->preferences->set($key, $val);
        }
    }

    public function toggleThemeVariation()
    {
        $this->validateAjaxCsrfToken();
        $this->user->preferences->set('themeAlt', !$this->user->preferences->themeAlt);
    }

    public function toggleHideSidebar()
    {
        $this->validateAjaxCsrfToken();
        $this->user->preferences->set('hideSidebar', !$this->user->preferences->hideSidebar);
    }
}
