<?php
namespace YBoard\Controllers;

use YBoard\BaseController;
use YFW\Library\ReCaptcha;
use YBoard\Models\LogModel;
use YBoard\Models\User;
use YBoard\Models\UserSession;

class Session extends BaseController
{
    public function logIn(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['username']) || empty($_POST['password'])) {
            $this->throwJsonError(401, _('Invalid username or password'), _('Login failed'));
        }

        $newUser = User::getByLogin($this->db, $_POST['username'], $_POST['password']);
        if (!$newUser) {
            $this->throwJsonError(403, _('Invalid username or password'), _('Login failed'));
        }

        $this->user->session->destroy();

        $newUser->session = UserSession::create($this->db, $newUser->id);

        $this->setLoginCookie($newUser->id, $newUser->session->id, $newUser->session->verifyKey);

        // Log mod logins
        if ($newUser->class != 0) {
            $log = new LogModel($this->db);
            $log->write(LogModel::ACTION_ID_MOD_LOGIN, $newUser->id);
        }

        $this->jsonPageReload();
    }

    public function logOut(): void
    {
        $this->validateAjaxCsrfToken();

        $destroySession = $this->user->session->destroy();
        if (!$destroySession) {
            $this->throwJsonError(500, _('What the!? Can\'t logout!?'));
        }

        $this->deleteLoginCookie();
        $this->jsonPageReload();
    }

    public function signUp(): void
    {
        $this->validateAjaxCsrfToken();

        if ($this->user->loggedIn) {
            $this->throwJsonError(400, _('You are already logged in'), _('Signup failed'));
        }

        if (empty($_POST['username']) || empty($_POST['password']) || empty($_POST['repassword'])) {
            $this->throwJsonError(400, _('Missing username or password'), _('Signup failed'));
        }

        if ($_POST['password'] !== $_POST['repassword']) {
            $this->throwJsonError(400, _('The two passwords do not match'), _('Signup failed'));
        }

        if ($this->user->requireCaptcha) {
            if (empty($_POST["g-recaptcha-response"])) {
                $this->throwJsonError(400, _('Please fill the CAPTCHA'), _('Signup failed'));
            }

            $captchaOk = ReCaptcha::verify($_POST["g-recaptcha-response"], $this->config['reCaptcha']['privateKey']);
            if (!$captchaOk) {
                $this->throwJsonError(400, _('Invalid CAPTCHA response, please try again'), _('Signup failed'));
            }
        }

        if (mb_strlen($_POST['username']) > $this->config['view']['usernameMaxLength']) {
            $this->throwJsonError(400, _('Username is too long'), _('Signup failed'));
        }

        if (!User::usernameIsFree($this->db, $_POST['username'])) {
            $this->throwJsonError(400, _('This username is already taken, please choose another one'), _('Signup failed'));
        }

        $this->user->setUsername($_POST['username']);
        $this->user->setPassword($_POST['password']);

        $this->jsonPageReload();
    }
}
