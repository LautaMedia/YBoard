<?php
namespace YBoard\Traits;

use YBoard\Library\HttpResponse;

trait Ajax
{
    protected function invalidAjaxData()
    {
        HttpResponse::setStatusCode(400);
        $this->jsonMessage(_('Invalid request'));
        $this->stopExecution();
    }

    protected function jsonPageReload(string $url = null)
    {
        echo json_encode(['reload' => true, 'url' => $url]);
    }

    protected function jsonMessage(string $message, string $title = null, bool $reload = false, string $url = null)
    {
        $args = [
            'title' => $title,
            'message' => $message,
            'reload' => $reload,
            'url' => $url,
        ];

        echo json_encode($args);
    }

    protected function throwJsonError(int $statusCode, string $message = null, string $title = null)
    {
        HttpResponse::setStatusCode($statusCode);

        if ($message) {
            $this->jsonMessage($message, $title);
        }

        $this->stopExecution();
    }

    protected abstract function stopExecution();
}
