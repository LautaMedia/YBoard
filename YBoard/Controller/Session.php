<?php
namespace YBoard\Controller;

use YBoard\Abstracts\ExtendedController;
use YBoard\Library\HttpResponse;
use YBoard\Library\ReCaptcha;
use YBoard\Model\Log;
use YBoard\Model\Users;
use YBoard\Model\UserSessions;

class Session extends ExtendedController
{
    public function logIn()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['username']) || empty($_POST['password'])) {
            $this->throwJsonError(401, _('Invalid username or password'), _('Login failed'));
        }

        $users = new Users($this->db);
        $newUser = $users->getByLogin($_POST['username'], $_POST['password']);
        if (!$newUser) {
            $this->throwJsonError(403, _('Invalid username or password'), _('Login failed'));
        }

        $this->user->session->destroy();

        $userSessions = new UserSessions($this->db);
        $newUser->session = $userSessions->create($newUser->id);

        $this->setLoginCookie($newUser->id, $newUser->session->id);

        // Log mod logins
        if ($newUser->class != 0) {
            $log = new Log($this->db);
            $log->write(Log::ACTION_ID_MOD_LOGIN, $newUser->id);
        }

        $this->jsonPageReload();
    }

    public function logOut()
    {
        $this->validateAjaxCsrfToken();

        $destroySession = $this->user->session->destroy();
        if (!$destroySession) {
            $this->throwJsonError(500, _('What the!? Can\'t logout!?'));
        }

        $this->deleteLoginCookie();
        $this->jsonPageReload();
    }

    public function signUp()
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

        $users = new Users($this->db);
        if (!$users->usernameIsFree($_POST['username'])) {
            $this->throwJsonError(400, _('This username is already taken, please choose another one'), _('Signup failed'));
        }

        $this->user->setUsername($_POST['username']);
        $this->user->setPassword($_POST['password']);

        $this->jsonPageReload();
    }
}
