<?php

namespace YBoard;

use YFW\Controller;
use YFW\Library\Database;
use YFW\Library\HttpResponse;
use YFW\Library\i18n;
use YFW\Library\TemplateEngine;
use YBoard\Models\Bans;
use YBoard\Models\Boards;
use YBoard\Models\PostReports;
use YBoard\Models\Users;
use YBoard\Models\UserSession;
use YBoard\Models\UserSessions;
use YBoard\Traits\Ajax;
use YBoard\Traits\Cookies;
use YBoard\Traits\ErrorPages;
use YBoard\Traits\PostChecks;

abstract class BaseController extends Controller
{
    use ErrorPages;
    use Cookies;
    use PostChecks;
    use Ajax;

    protected $config;
    protected $i18n;
    protected $db;
    protected $boards;
    protected $user;
    protected $locale;
    protected $localeDomain;

    public function __construct()
    {
        // Load config
        $this->config = require(ROOT_PATH . '/YBoard/Config/App.php');

        // Get a database connection
        $this->db = new Database(require(ROOT_PATH . '/YBoard/Config/Database.php'));

        // Load some data that are required on almost every page, like the list of boards and user data
        $this->boards = new Boards($this->db);

        // Load internalization
        $this->i18n = new i18n(ROOT_PATH . '/YBoard/Locales');

        // Load user
        $this->loadUser();

        // Get locale
        $this->locale = $this->i18n->getPreferredLocale();
        if (!$this->locale) {
            // Fallback
            $this->locale = $this->config['i18n']['defaultLocale'];
        }
        $this->localeDomain = 'default'; // TODO: Add support for custom domains

        // Set locale
        $this->i18n->loadLocale($this->locale);
    }

    public function __destruct()
    {
        $resourceUsage = round((microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']) * 1000,
                2) . ' ms ' . round(memory_get_usage() / 1024 / 1024, 2) . ' MB';
        // Only for non-ajax requests
        if (!isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            // Debug: Execution time and memory usage
            echo '<!-- ' . $resourceUsage . ' -->';
        } else {
            //error_log($resourceUsage);
        }
    }

    protected function loadUser()
    {
        $cookie = $this->getLoginCookie();
        if ($cookie !== false) {
            // Load session
            $userSessions = new UserSessions($this->db);
            $session = $userSessions->get($cookie['userId'], $cookie['sessionId']);
            if ($session === false) {
                $this->deleteLoginCookie(true);
            }

            // Load user
            $users = new Users($this->db);
            $this->user = $users->getById($session->userId);
            if ($this->user === false) {
                $this->deleteLoginCookie(true);
            }

            $this->user->session = $session;

            // Update last active timestamps
            $this->user->updateLastActive();
            $this->user->session->updateLastActive();
        } else {
            // Session does not exist
            $users = new Users($this->db);
            if ($this->userMaybeBot()) {
                $this->user = $users->createTemporary();
                $this->user->session = new UserSession($this->db);

                return false;
            }

            $this->user = $users->create();

            $userSessions = new UserSessions($this->db);
            $this->user->session = $userSessions->create($this->user->id);

            $this->setLoginCookie($this->user->id, $this->user->session->id);
        }

        return true;
    }

    protected function userMaybeBot()
    {
        if (empty($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
            // Great way of detecting crawlers!
            return true;
        }

        if (empty($_SERVER['HTTP_USER_AGENT'])) {
            return true;
        }

        if (preg_match('/Baiduspider/i', $_SERVER['HTTP_USER_AGENT'])) {
            return true;
        }

        if (preg_match('/msnbot/i', $_SERVER['HTTP_USER_AGENT'])) {
            return true;
        }

        return false;
    }

    protected function dieWithMessage(
        $errorTitle,
        $errorMessage,
        $httpStatus = false,
        $bodyClass = false,
        $image = false
    ) {
        if ($httpStatus && is_int($httpStatus)) {
            HttpResponse::setStatusCode($httpStatus);
        }
        $view = $this->loadTemplateEngine();

        $view->pageTitle = $view->errorTitle = $errorTitle;
        $view->errorMessage = $errorMessage;

        // Support for "state saving", for login etc.
        if (!empty($_POST['redirto'])) {
            $view->redirTo = $_POST['redirto'];
        }

        $view->bodyClass = 'error';
        if (!empty($bodyClass)) {
            $view->bodyClass .= ' ' . $bodyClass;
        }
        if (!empty($image)) {
            $view->errorImageSrc = $image;
        }

        $view->display('Error');
        $this->stopExecution();
    }

    protected function initializePagination($view, $pageNum, $maxPages, $isLastPage, $base = '')
    {
        if ($isLastPage) {
            $maxPages = $pageNum;
        }

        // Calculate the end and start pages of the pagination
        // We don't count the total number of pages to save some resources.
        $view->paginationBase = $base;
        $view->maxPages = $maxPages;
        $view->paginationStartPage = $pageNum - 1;
        if ($view->paginationStartPage < 2) {
            $view->paginationStartPage = 2;
        }

        $view->paginationEndPage = $pageNum + 2;
        if ($view->paginationEndPage > $maxPages) {
            $view->paginationEndPage = $maxPages;
        }
    }

    protected function limitPages($pageNum, $maxPages)
    {
        if ($pageNum > $maxPages) {
            $this->notFound(_('Not found'), sprintf(_('Please don\'t. %s pages is enough.'), $maxPages));
        }
    }

    protected function loadTemplateEngine($templateFile = 'Default')
    {
        $templateEngine = new TemplateEngine(ROOT_PATH . '/YBoard/Views/', $templateFile);

        foreach ($this->config['view'] as $var => $val) {
            $templateEngine->$var = $val;
        }

        // Some things are only done when loading regular pages with the "Default" template
        if ($templateFile == 'Default') {
            $this->user->statistics->increment('pageLoads');

            // Mod functions
            if ($this->user->isMod) {
                // Get unchecked reports
                $reports = new PostReports($this->db);
                $templateEngine->uncheckedReports = $reports->getUncheckedCount();

                // Get ban appeals
                $bans = new Bans($this->db);
                $templateEngine->uncheckedBanAppeals = $bans->getUncheckedAppealCount();
            }
        }

        // Verify theme exists
        if (!array_key_exists($this->user->preferences->theme, $this->config['view']['themes'])) {
            $this->user->preferences->reset('theme');
        }
        if ($this->user->preferences->themeAlt && !$this->config['view']['themes'][$this->user->preferences->theme]['altCss']) {
            $this->user->preferences->reset('themeAlt');
        }

        if ($this->user->preferences->themeAlt) {
            $theme = $this->config['view']['themes'][$this->user->preferences->theme]['altCss'];
            $altTheme = $this->config['view']['themes'][$this->user->preferences->theme]['css'];
        } else {
            $theme = $this->config['view']['themes'][$this->user->preferences->theme]['css'];
            $altTheme = $this->config['view']['themes'][$this->user->preferences->theme]['altCss'];
        }

        $templateEngine->stylesheet = $theme;
        $templateEngine->altStylesheet = $altTheme;

        $templateEngine->locale = $this->locale;
        $templateEngine->localeDomain = $this->localeDomain;
        $templateEngine->csrfToken = $this->user->session->csrfToken;
        $templateEngine->reCaptchaPublicKey = $this->config['reCaptcha']['publicKey'];
        $templateEngine->user = $this->user;
        $templateEngine->boardList = $this->boards->getAll();

        return $templateEngine;
    }

    protected function modOnly()
    {
        if (!$this->user->isMod) {
            $this->notFound();
        }
    }

    protected function validateCsrfToken($token)
    {
        if (empty($token) || empty($this->user->session->csrfToken)) {
            return false;
        }

        if ($token == $this->user->session->csrfToken) {
            return true;
        }

        return false;
    }

    protected function validatePostCsrfToken()
    {
        if (!$this->isPostRequest() || empty($_POST['csrf_token']) || !$this->validateCsrfToken($_POST['csrf_token'])) {
            $this->badRequest();
        }
    }

    protected function validateAjaxCsrfToken()
    {
        if ($this->user->id === null) {
            $this->ajaxCsrfValidationFail();
        }

        if (!$this->isPostRequest()) {
            $this->ajaxCsrfValidationFail();
        }

        if (empty($_SERVER['HTTP_X_CSRF_TOKEN']) || empty($this->user->session->csrfToken)) {
            $this->ajaxCsrfValidationFail();
        }

        if ($_SERVER['HTTP_X_CSRF_TOKEN'] == $this->user->session->csrfToken) {
            return true;
        }

        $this->ajaxCsrfValidationFail();

        return false;
    }

    protected function ajaxCsrfValidationFail()
    {
        $this->throwJsonError(401, _('Your session has expired. Please refresh this page and try again.'));
        $this->stopExecution();
    }
}
