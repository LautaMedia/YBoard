<?php
namespace YBoard\Controllers;

use YBoard\BaseController;

class Notifications extends BaseController
{
    function get()
    {
        $this->validateAjaxCsrfToken();

        $view = $this->loadTemplateEngine('Blank');

        $view->notifications = $this->user->notifications->getAll();
        $view->display('Ajax/NotificationList');
    }

    function markRead()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['id'])) {
            $this->throwJsonError(400);
        }

        $notification = $this->user->notifications->get($_POST['id']);
        if ($notification !== false) {
            $notification->markRead();
        }
    }

    function markAllRead()
    {
        $this->validateAjaxCsrfToken();

        $this->user->notifications->markAllRead();
    }
}
