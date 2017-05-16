<?php
namespace YBoard\Controllers;

use YBoard\BaseController;

class Notification extends BaseController
{
    function get(): void
    {
        $this->validateAjaxCsrfToken();

        $view = $this->loadTemplateEngine('Blank');

        $view->notifications = $this->user->notifications->getAll();
        $view->display('Ajax/NotificationList');
    }

    function markRead(): void
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

    function markAllRead(): void
    {
        $this->validateAjaxCsrfToken();

        $this->user->notifications->markAllRead();
    }
}
