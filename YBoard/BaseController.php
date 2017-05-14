<?php

namespace YBoard;

use YBoard\Models\Ban;
use YBoard\Models\Board;
use YBoard\Models\PostReport;
use YBoard\Models\User;
use YBoard\Models\UserSession;
use YFW\Controller;
use YFW\Library\Database;
use YFW\Library\HttpResponse;
use YFW\Library\i18n;
use YFW\Library\Profiler;
use YFW\Library\TemplateEngine;

abstract class BaseController extends Controller
{
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
        $this->boards = Board::getAll($this->db);

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
        if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || $_SERVER['HTTP_X_REQUESTED_WITH'] != 'XMLHttpRequest') {
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
            $session = UserSession::get($this->db, $cookie['userId'], $cookie['sessionId']);
            if ($session === false) {
                $this->deleteLoginCookie(true);
            }

            // Load user
            $this->user = User::getById($this->db, $session->userId);
            if ($this->user === false) {
                $this->deleteLoginCookie(true);
            }

            $this->user->session = $session;

            // Update last active timestamps
            $this->user->updateLastActive();
            $this->user->session->updateLastActive();
        } else {
            // Session does not exist
            if ($this->userMaybeBot()) {
                $this->user = User::createTemporary($this->db);
                $this->user->session = new UserSession($this->db);

                return false;
            }

            $this->user = User::create($this->db);
            $this->user->session = UserSession::create($this->db, $this->user->id);

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
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
            if (!$httpStatus || !is_int($httpStatus)) {
                $httpStatus = 500;
            }
            $this->throwJsonError($httpStatus, $errorMessage, $errorTitle);
            return true;
        }

        if ($httpStatus && is_int($httpStatus)) {
            HttpResponse::setStatusCode($httpStatus);
        }

        $view = $this->loadTemplateEngine();

        $view->setVar('pageTitle', $errorTitle);
        $view->setVar('errorTitle', $errorTitle);
        $view->setVar('errorMessage', $errorMessage);

        // Support for "state saving", for login etc.
        if (!empty($_POST['redirto'])) {
            $view->redirTo = $_POST['redirto'];
        }

        $bc = 'error';
        if (!empty($bodyClass)) {
            $bc .= ' ' . $bodyClass;
        }
        $view->setVar('bodyClass', $bc);
        if (!empty($image)) {
            $view->setVar('errorImageSrc', $image);
        }

        $view->display('Error');
        $this->stopExecution();
    }

    protected function initializePagination(TemplateEngine $view, int $pageNum, int $maxPages, bool $isLastPage, string $base = '')
    {
        if ($isLastPage) {
            $maxPages = $pageNum;
        }

        // Calculate the end and start pages of the pagination
        // We don't count the total number of pages to save some resources.
        $startPage = $pageNum - 1;
        if ($startPage < 2) {
            $startPage = 2;
        }

        $endPage = $pageNum + 2;
        if ($endPage > $maxPages) {
            $endPage = $maxPages;
        }

        $view->setVar('pagination', [
            'base' => $base,
            'page' => $pageNum,
            'maxPages' => $maxPages,
            'startPage' => $startPage,
            'endPage' => $endPage,
        ]);
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

        $templateEngine->setVar('config', $this->config);

        // Some things are only done when loading regular pages with the "Default" template
        if ($templateFile == 'Default') {
            $this->user->statistics->increment('pageLoads');

            // Mod functions
            if ($this->user->isMod) {
                // Get unchecked reports
                $reports = new PostReport($this->db);

                // Get ban appeals
                $bans = new Ban($this->db);
                $templateEngine->setVar('moderation', [
                    'uncheckedReports' => $reports->getUncheckedCount(),
                    'uncheckedBanAppeals' => $bans->getUncheckedAppealCount()
                ]);
            }
        }

        // Verify theme exists
        if (!array_key_exists($this->user->preferences->theme, $this->config['themes'])) {
            $this->user->preferences->reset('theme');
        }

        if ($this->user->preferences->theme === null) {
            $theme = $this->config['view']['defaultTheme'];
        } else {
            $theme = $this->user->preferences->theme;
        }

        $templateEngine->setVar('stylesheet', [
            'active' => !$this->user->preferences->darkTheme ? $this->config['themes'][$theme]['light']
                : $this->config['themes'][$theme]['dark'],
            'color' => $this->config['themes'][$theme]['color'],
            'light' => $this->config['themes'][$theme]['light'],
            'dark' => $this->config['themes'][$theme]['dark'],
            'darkTheme' => $this->user->preferences->darkTheme ? 'true' : 'false',
        ]);

        $templateEngine->setVar('locale', [
            'name' => $this->locale,
            'domain' => $this->localeDomain,
        ]);

        $templateEngine->setVar('user', $this->user);
        $templateEngine->setVar('boardList', $this->boards);

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

    protected function getLoginCookie()
    {
        if (empty($_COOKIE['user'])) {
            return false;
        }

        if (strlen($_COOKIE['user']) <= 65 || substr_count($_COOKIE['user'], '-') !== 1) {
            return false;
        }

        list($userId, $sessionId) = explode('-', $_COOKIE['user']);

        return ['userId' => (int)$userId, 'sessionId' => hex2bin($sessionId)];
    }

    protected function setLoginCookie(int $userId, $sessionId): bool
    {
        $sessionId = bin2hex($sessionId);
        HttpResponse::setCookie('user', $userId . '-' . $sessionId);

        return true;
    }

    protected function deleteLoginCookie(bool $reload = false): bool
    {
        HttpResponse::setCookie('user', '', false);
        if ($reload) {
            HttpResponse::redirectExit($_SERVER['REQUEST_URI']);
        }

        return true;
    }

    protected function badRequest($errorTitle = false, $errorMessage = false)
    {
        $errorTitle = empty($errorTitle) ? _('Bad request') : $errorTitle;
        $errorMessage = empty($errorMessage) ? _('Your request did not complete because it contained invalid information.') : $errorMessage;
        $this->dieWithMessage($errorTitle, $errorMessage, 400);
    }

    protected function unauthorized($errorTitle = false, $errorMessage = false)
    {
        $errorTitle = empty($errorTitle) ? _('Unauthorized') : $errorTitle;
        $errorMessage = empty($errorMessage) ? _('You are not authorized to perform this operation') : $errorMessage;
        $this->dieWithMessage($errorTitle, $errorMessage, 401);
    }

    protected function blockAccess($errorTitle = false, $errorMessage = false)
    {
        $errorTitle = empty($errorTitle) ? _('Forbidden') : $errorTitle;
        $errorMessage = empty($errorMessage) ? _('Thou shalt not access this resource!') : $errorMessage;
        $this->dieWithMessage($errorTitle, $errorMessage, 403);
    }

    public function notFound($errorTitle = false, $errorMessage = false)
    {
        $errorTitle = empty($errorTitle) ? _('Page not found') : $errorTitle;
        $errorMessage = empty($errorMessage) ? _('Whatever you were looking for does not exist here. Probably never did.') : $errorMessage;

        $images = glob(ROOT_PATH . '/public/static/img/404/*.*');
        if (!empty($images)) {
            $image = $this->imagePathToUrl($images[array_rand($images)]);
        } else {
            $images = false;
        }

        $this->dieWithMessage($errorTitle, $errorMessage, 404, 'notfound', $image);
    }

    protected function internalError($errorTitle = false, $errorMessage = false)
    {
        $errorTitle = empty($errorTitle) ? _('Oh noes!') : $errorTitle;
        $errorMessage = empty($errorMessage) ? _('We\'re terribly sorry. An internal error occurred when we tried to complete your request.') : $errorMessage;

        $images = glob(ROOT_PATH . '/public/static/img/500/*.*');
        if (!empty($images)) {
            $image = $this->imagePathToUrl($images[array_rand($images)]);
        } else {
            $images = false;
        }

        $this->dieWithMessage($errorTitle, $errorMessage, 500, 'internalerror', $image);
    }

    protected function imagePathToUrl($path)
    {
        return $this->config['app']['staticUrl'] . str_replace(ROOT_PATH . '/static', '', $path);
    }

    protected function disallowNonPost()
    {
        if (!$this->isPostRequest()) {
            HttpResponse::setStatusCode(405, ['Allowed' => 'POST']);
            $this->stopExecution();
        }
    }

    protected function isPostRequest()
    {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            return true;
        }

        return false;
    }
}
