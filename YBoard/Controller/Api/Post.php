<?php
namespace YBoard\Controller\Api;

use YBoard\Controller;
use YBoard\MessageQueue;
use YFW\Library\BbCode;
use YFW\Library\Cache;
use YFW\Library\HttpResponse;
use YFW\Library\ReCaptcha;
use YFW\Library\Text;
use YBoard\Model;

class Post extends Controller
{
    public function get(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['postId'])) {
            $this->throwJsonError(400);
        }

        $post = Model\Post::get($this->db, $_POST['postId']);
        if ($post === false) {
            $this->throwJsonError(404, _('Post does not exist'));
        }

        // Thread meta required for OP tag
        if (empty($post->threadId)) {
            $post->threadId = $post->id;
        }
        $thread = Model\Thread::get($this->db, $post->threadId, false);

        $view = $this->loadTemplateEngine('Blank');

        $view->setVar('tooltip', true);
        $view->setVar('post', $post);
        $view->setVar('thread', $thread);
        $view->setVar('board', Model\Board::getById($this->db, $thread->boardId));

        $view->display('Ajax/Post');
    }

    public function redirect(int $postId): void
    {
        $post = Model\Post::get($this->db, $postId, false);

        if ($post === false) {
            $this->notFound(_('Not found'), _('Post does not exist'));
        }

        if (!$post->boardId) {
            $thread = Model\Thread::get($this->db, $post->threadId, false);

            if ($thread === false) {
                $this->internalError();
            }

            $boardId = $thread->boardId;
        } else {
            $boardId = $post->boardId;
        }

        $board = Model\Board::getById($this->db, $boardId);
        if (!$board) {
            $this->internalError();
        }

        if (empty($post->threadId)) {
            $thread = $post->id;
            $hash = '';
        } else {
            $thread = $post->threadId;
            $hash = '#post-' . $post->id;
        }

        HttpResponse::redirectExit('/' . $board->url . '/' . $thread . $hash, 302);
    }

    public function submit(): void
    {
        $this->validateAjaxCsrfToken();

        // Check bans
        if ($this->user->ban) {
            $this->throwJsonError(403, _('You are banned!'));
        }

        // Is this a reply or a new thread?
        if (!empty($_POST['thread'])) {
            if(!filter_var($_POST['thread'], FILTER_VALIDATE_INT)) {
                $this->throwJsonError(400, _('Invalid thread'));
            }
            $isReply = true;
        } else {
            $isReply = false;
        }

        // Is there a file in the post?
        if (!empty($_POST['file_id'])) {
            if(!filter_var($_POST['file_id'], FILTER_VALIDATE_INT)) {
                $this->throwJsonError(400, _('Invalid file'));
            }
            $hasFile = true;
        } else {
            $hasFile = false;
        }

        if (!empty($_POST['file_name'])) {
            $fileName = trim(Text::removeForbiddenUnicode($_POST['file_name']));
        }

        // Verify file
        if ($hasFile) {
            $file = Model\File::get($this->db, $_POST['file_id']);
            if ($file === false) {
                $this->throwJsonError(400, _('Invalid file'));
            }
        }

        // Try getting a file by given name
        if (!$hasFile && !empty($fileName)) {
            $file = Model\File::getByOrigName($this->db, $fileName);
            if (!$file) {
                $this->throwJsonError(404,
                    sprintf(_('File "%s" was not found, please type a different name or choose a file to upload'),
                        htmlspecialchars($fileName)));
            }
            $hasFile = true;
            $_POST['file_id'] = $file->id;
        } elseif ($hasFile && empty($fileName)) {
            $this->throwJsonError(400, _('Please type a file name'));
        }

        // Prepare message
        $message = isset($_POST['message']) ? trim($_POST['message']) : false;
        $hasMessage = !empty($message) || $message === '0';

        if (!$isReply) { // Creating a new thread
            // Verify board
            if (empty($_POST['board']) || !Model\Board::exists($this->db, $_POST['board'])) {
                $this->throwJsonError(400, _('Invalid board'));
            }

            // Message is required for new threads
            if (!$hasMessage) {
                $this->throwJsonError(400, _('Please type a message'));
            }

            $board = Model\Board::getByUrl($this->db, $_POST['board']);
        } else { // Replying to a thread
            $thread = Model\Thread::get($this->db, $_POST['thread'], false);

            // Verify thread
            if ($thread === false) {
                $this->throwJsonError(400, _('Invalid thread'));
            }

            if ($thread->locked && !$this->user->isMod) {
                $this->throwJsonError(400, _('This thread is locked'));
            }
            $board = Model\Board::getById($this->db, $thread->boardId);

            // Message OR file is required for replies
            if (!$hasMessage && !$hasFile) {
                $this->throwJsonError(400, _('Please type a message or choose a file'));
            }
        }

        if ($this->user->requireCaptcha) {
            if (empty($_POST["g-recaptcha-response"])) {
                $this->throwJsonError(400, _('Empty CAPTCHA response. Please try again.'));
            }

            $captchaOk = ReCaptcha::verify($_POST["g-recaptcha-response"], $this->config['captcha']['privateKey']);
            if (!$captchaOk) {
                $this->throwJsonError(403, _('Validating the CAPTCHA response failed. Please try again.'));
            }
        }

        // IP2Location
        if ($this->config['ip2location']['enabled']) {
            require_once($this->config['ip2location']['apiFile']);
            if (!filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
                // IPv4
                $ip2location = new \IP2Location\Database($this->config['ip2location']['v4Database']);
            } else {
                // IPv6
                $ip2location = new \IP2Location\Database($this->config['ip2location']['v6Database']);
            }
            $countryCode = $ip2location->lookup($_SERVER['REMOTE_ADDR'], \IP2Location\Database::COUNTRY)['countryCode'];
            $countryCode = strtoupper($countryCode);
        } else {
            $countryCode = null;
        }

        // Message options
        $sage = empty($_POST['sage']) ? false : true;
        $useName = empty($_POST['usename']) ? false : true;

        // TODO: Add functionality
        if ($this->user->goldLevel == 0) {
            $noCompress = false;
            $goldHide = false;
        } else {
            $noCompress = empty($_POST['nocompress']) ? false : true;
            $goldHide = empty($_POST['goldhide']) ? false : true;
        }

        // Preprocess message
        $message = isset($_POST['message']) ? trim($_POST['message']) : '';
        if (!empty($message)) {
            $message = Text::removeForbiddenUnicode($message);
            $message = Text::limitEmptyLines($message);
            $message = mb_substr($message, 0, $this->config['posts']['messageMaxLength']);
        }

        // Only most basic text formatting for non-golds.
        if ($this->user->goldLevel == 0) {
            $message = BbCode::removeDisallowed($message);
        }

        // Check blacklist
        $wordBlacklist = new Model\WordBlacklist($this->db);
        $blacklistReason = $wordBlacklist->match($message);
        if ($blacklistReason !== null) {
            $this->throwJsonError(403, sprintf(_('Your message contained a blacklisted word: %s'), $blacklistReason));
        }

        $subject = null;
        if (!$isReply && isset($_POST['subject'])) {
            $subject = trim(mb_substr($_POST['subject'], 0, $this->config['posts']['subjectMaxLength']));
        }

        $username = null;
        if ($useName && $this->user->goldLevel != 0) {
            $username = $this->user->username;
        }

        $messageQueue = new MessageQueue();
        $notificationsSkipUsers = [];
        if (!$isReply) {
            // Check flood limit
            if (Cache::exists('SpamLimit-thread-' . $_SERVER['REMOTE_ADDR'])) {
                $this->throwJsonError(403, _('You are sending messages too fast. Please don\'t spam.'));
            }

            $post = Model\Thread::create($this->db, $this->user->id, $board->id, $subject, $message, $username, $countryCode);

            // Increment stats
            $this->user->statistics->increment('createdThreads');

            // Enable flood limit
            Cache::add('SpamLimit-thread-' . $_SERVER['REMOTE_ADDR'], 1, $this->config['posts']['threadIntervalLimit']);
        } else {
            // Check flood limit
            if (Cache::exists('SpamLimit-reply-' . $_SERVER['REMOTE_ADDR'])) {
                $this->throwJsonError(403, _('You are sending messages too fast. Please don\'t spam.'));
            }

            $post = $thread->addReply($this->user->id, $message, $username, $countryCode);

            // Update stats
            $this->user->statistics->increment('sentReplies');
            $thread->updateStats('replyCount');

            // Increment followed threads unread count
            Model\UserThreadFollow::incrementUnreadCount($this->db, $thread->id, $this->user->id);

            // Enable flood limit
            Cache::add('SpamLimit-reply-' . $_SERVER['REMOTE_ADDR'], 1, $this->config['posts']['replyIntervalLimit']);

            if (!$sage) {
                $thread->bump();
            }

            if ($thread->userId != $this->user->id) {
                // Notify OP
                $messageQueue->send([
                    Model\UserNotification::NOTIFICATION_TYPE_THREAD_REPLY,
                    $thread->id,
                    $notificationsSkipUsers,
                ], MessageQueue::MSG_TYPE_ADD_POST_NOTIFICATION);
                $notificationsSkipUsers[] = $thread->userId;

                // Mark thread notifications as read
                $this->user->notifications->markReadByThread($thread->id);
            } else {
                // Mark thread notifications as read for OP
                $this->user->notifications->markReadByPost($thread->id);
            }
        }

        // Save file
        if ($hasFile) {
            $post->addFile($file->id, $_POST['file_name']);
        }

        // Increment Total message characters -stats
        $this->user->statistics->increment('messageTotalCharacters', mb_strlen($message));

        // Save replies
        preg_match_all('/>>([0-9]+)/i', $message, $postReplies);
        $postReplies = array_unique($postReplies[1]);
        $post->setReplies($postReplies);

        // TODO: Save tags

        // Notify all replied users
        if (!empty($postReplies)) {
            $notificationsSkipUsers[] = $this->user->id;
            $messageQueue->send([
                Model\UserNotification::NOTIFICATION_TYPE_POST_REPLY,
                $postReplies,
                $notificationsSkipUsers
            ], MessageQueue::MSG_TYPE_ADD_POST_NOTIFICATION);
        }

        if (!$isReply) {
            $this->jsonMessage($post->id);
        }
    }

    public function delete(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['postId'])) {
            $this->throwJsonError(400);
        }

        $posts = new Post($this->db);
        $post = $posts->get($_POST['postId'], false);
        if ($post === false) {
            $this->throwJsonError(404, _('Post does not exist'));
        }

        if ($post->userId != $this->user->id && !$this->user->isMod) {
            $this->throwJsonError(403, _('This isn\'t your post!'));
        }

        if ($post->userId != $this->user->id) {
            // Log post deletions by mods
            $log = new LogModel($this->db);
            $log->write(LogModel::ACTION_ID_MOD_POST_DELETE, $this->user->id, $post->id);
        }

        if (!empty($post->threadId)) {
            $thread = $posts->getThread($post->threadId, false);
            $thread->undoLastBump();
        }

        $messageQueue = new MessageQueue();

        // Delete notifications about post replies
        $replied = $post->getRepliedPosts();
        if (!empty($replied)) {
            $messageQueue->send([
                'types' => UserNotification::NOTIFICATION_TYPE_POST_REPLY,
                'posts' => $replied,
            ], MessageQueue::MSG_TYPE_REMOVE_POST_NOTIFICATION);
        }

        // Delete post
        $post->delete();
    }

    public function deleteFile(): void
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['post_id'])) {
            $this->throwJsonError(400);
        }

        $posts = new Post($this->db);
        $post = $posts->get($_POST['post_id'], false);
        if ($post === false) {
            $this->throwJsonError(404, _('Post does not exist'));
        }

        if ($post->userId != $this->user->id && !$this->user->isMod) {
            $this->throwJsonError(403, _('This isn\'t your post!'));
        }

        if ($post->userId != $this->user->id) {
            // Log file deletions by mods
            $log = new LogModel($this->db);
            $log->write(LogModel::ACTION_ID_MOD_POST_FILE_DELETE, $this->user->id, $post->id);
        }

        // Delete file
        $post->removeFiles();
    }

    public function report(): void
    {
        $this->validateAjaxCsrfToken();

        if ($this->user->ban) {
            $this->throwJsonError(403, _('You are banned!'));
        }

        if (empty($_POST['post_id']) || empty($_POST['reason_id'])) {
            $this->throwJsonError(400);
        }

        $posts = new Post($this->db);
        if ($posts->get($_POST['post_id'], false) === false) {
            $this->throwJsonError(404, _('Post does not exist'));
        }

        $postReports = new PostReport($this->db);

        if ($postReports->isReported($_POST['post_id'])) {
            $this->throwJsonError(418, _('This message has already been reported and is waiting for a review'));
        }

        $additionalInfo = empty($_POST['report_additional_info']) ? null : mb_substr($_POST['report_additional_info'], 0, 120);
        $postReports->add($_POST['post_id'], $_POST['reason_id'], $additionalInfo);
    }
}
