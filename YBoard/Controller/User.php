<?php
namespace YBoard\Controller;

use YBoard\Controller;
use YBoard\Model;
use YFW\Library\Text;

class User extends Controller
{
    public function profile(?int $userId = null): void
    {
        if ($userId === null) {
            $user = $this->user;
            $pageTitle = _('Your profile');
        } else {
            if (!$this->user->isAdmin) {
                $this->notFound();
            }

            $users = new User($this->db);
            $user = $users->getById($userId);

            if ($user->id === null) {
                $this->notFound();
            }

            if (!empty($user->username)) {
                $pageTitle = sprintf(_('Profile for user %s'), $user->username);
            } else {
                $pageTitle = _('Profile for unregistered user');
            }
        }

        $view = $this->loadTemplateEngine();
        $view->pageTitle = $pageTitle;
        $view->profile = $user;

        if ($this->user->id !== null) {
            $view->loginSessions = Model\UserSession::getAll($this->db, $this->user->id);
        }
        $view->display('Profile');
    }

    public function changeName(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['newName']) || empty($_POST['password'])) {
            $this->throwJsonError(400, _('Please fill all of the required fields'));
        }

        if (mb_strlen($_POST['newName']) > $this->config['view']['usernameMaxLength']) {
            $this->throwJsonError(400, _('Username is too long'));
        }

        if ($this->user->username == $_POST['newName']) {
            $this->throwJsonError(400, _('This is your current username'));
        }

        if (!Model\User::usernameIsFree($this->db, $_POST['newName'])) {
            $this->throwJsonError(400, _('This username is already taken, please choose another one'));
        }

        if (!$this->user->validatePassword($_POST['password'])) {
            $this->throwJsonError(401, _('Invalid password'));
        }

        $this->user->setUsername($_POST['newName']);

        $this->jsonPageReload();
    }

    public function changePassword(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['newPassword']) || empty($_POST['newPasswordAgain']) || empty($_POST['password'])) {
            $this->throwJsonError(400, _('Please fill all of the required fields'));
        }

        if ($_POST['newPassword'] != $_POST['newPasswordAgain']) {
            $this->throwJsonError(400, _('The two passwords do not match'));
        }

        if (!$this->user->validatePassword($_POST['password'])) {
            $this->throwJsonError(401, _('Invalid password'));
        }

        $this->user->setPassword($_POST['newPassword']);

        $this->jsonMessage(_('Password changed'));
    }

    public function destroySession(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['sessionId'])) {
            $this->throwJsonError(400);
        }

        $sessionId = Text::filterHex($_POST['sessionId']);

        $session = Model\UserSession::get($this->db, $this->user->id, hex2bin($sessionId), null, false);
        if ($session !== false) {
            $session->destroy();
        }

        $this->jsonMessage(_('Session destroyed'));
    }

    public function delete(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['password'])) {
            $this->throwJsonError(401, _('Please type your current password'));
        }

        if (empty($_POST['confirm'])) {
            $this->throwJsonError(401, _('Please confirm the deletion'));
        }

        if (!$this->user->validatePassword($_POST['password'])) {
            $this->throwJsonError(401, _('Invalid password'));
        }

        if (!empty($_POST['deletePosts'])) {
            Model\Post::deleteByUser($this->db, $this->user->id);
        }

        $this->user->delete();

        $this->deleteLoginCookie(false);
        $this->jsonPageReload('/');
    }
}
