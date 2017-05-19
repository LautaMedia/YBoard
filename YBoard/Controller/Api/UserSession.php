<?php
namespace YBoard\Controller;

use YBoard\Controller;
use YBoard\Model;
use YFW\Library\Text;

class UserSession extends Controller
{
    public function delete(): void
    {
        $this->validateAjaxCsrfToken();

        $session = null;
        if (empty($_POST['sessionId'])) {
            $session = $this->user->session;
        } elseif (empty($_POST['verifyKey'])) {
            $this->throwJsonError(400);
        } else {
            $sessionId = Text::filterHex($_POST['sessionId']);
            $verifyKey = Text::filterHex($_POST['verifyKey']);

            $userId = $this->user->id;
            if ($this->user->isAdmin && !empty($_POST['userId'])) {
                $userId = (int)$_POST['userId'];
            }

            $session = Model\UserSession::get($this->db, $userId, hex2bin($sessionId), hex2bin($verifyKey));
        }

        if ($session === null) {
            $this->throwJsonError('404', _('Invalid session'));
        }

        $session->destroy();
        $this->jsonMessage(_('Session destroyed'));
    }
}
