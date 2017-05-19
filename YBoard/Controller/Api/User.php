<?php
namespace YBoard\Controller;

use YBoard\Controller;
use YBoard\Model;
use YFW\Library\Text;

class User extends Controller
{
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
