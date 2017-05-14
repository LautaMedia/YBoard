<?php
namespace YBoard\Controllers;

use YBoard\BaseController;
use YFW\Library\BbCode;
use YFW\Library\Cache;
use YFW\Library\GeoIP;
use YFW\Library\HttpResponse;
use YFW\Library\MessageQueue;
use YFW\Library\ReCaptcha;
use YFW\Library\Text;
use YBoard\Models;

class Post extends BaseController
{
    public function get()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['postId'])) {
            $this->throwJsonError(400);
        }

        $post = Models\Post::get($this->db, $_POST['postId']);
        if ($post === false) {
            $this->throwJsonError(404, _('Post does not exist'));
        }

        // Thread meta required for OP tag
        if (empty($post->threadId)) {
            $post->threadId = $post->id;
        }
        $thread = $posts->getThread($post->threadId, false);

        $view = $this->loadTemplateEngine('Blank');

        $view->tooltip = true;
        $view->post = $post;
        $view->thread = $thread;
        $view->board = $this->boards->getById($thread->boardId);

        $view->display('Ajax/Post');
    }

    public function redirect($postId)
    {
        $posts = new Post($this->db);
        $post = $posts->get($postId, false);

        if ($post === false) {
            $this->notFound(_('Not found'), _('Post does not exist'));
        }

        if (!$post->boardId) {
            $thread = $posts->getThread($post->threadId, false);

            if ($thread === false) {
                $this->internalError();
            }

            $boardId = $thread->boardId;
        } else {
            $boardId = $post->boardId;
        }

        $board = $this->boards->getById($boardId);
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

    public function submit()
    {
        $this->validateAjaxCsrfToken();

        // Check bans
        if ($this->user->ban) {
            $this->throwJsonError(403, _('You are banned!'));
        }

        $posts = new Post($this->db);

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
            $files = new File($this->db);
            $file = $files->get($_POST['file_id']);
            if ($file === false) {
                $this->throwJsonError(400, _('Invalid file'));
            }
        }

        // Try getting a file by given name
        if (!$hasFile && !empty($fileName)) {
            $files = new File($this->db);
            $file = $files->getByOrigName($fileName);
            if (!$file) {
                $this->throwJsonError(404,
                    sprintf(_('File "%s" was not found, please type a different name or choose a file'),
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
            if (empty($_POST['board']) || !$this->boards->exists($_POST['board'])) {
                $this->throwJsonError(400, _('Invalid board'));
            }

            // Message is required for new threads
            if (!$hasMessage) {
                $this->throwJsonError(400, _('Please type a message'));
            }

            $board = $this->boards->getByUrl($_POST['board']);
        } else { // Replying to a thread
            $thread = $posts->getThread($_POST['thread'], false);

            // Verify thread
            if ($thread === false) {
                $this->throwJsonError(400, _('Invalid thread'));
            }

            if ($thread->locked && !$this->user->isMod) {
                $this->throwJsonError(400, _('This thread is locked'));
            }
            $board = $this->boards->getById($thread->boardId);

            // Message OR file is required for replies
            if (!$hasMessage && !$hasFile) {
                $this->throwJsonError(400, _('Please type a message or choose a file'));
            }
        }

        if ($this->user->requireCaptcha) {
            if (empty($_POST["captchaResponse"])) {
                $this->throwJsonError(400, _('Please fill the CAPTCHA.'));
            }

            $captchaOk = ReCaptcha::verify($_POST["captchaResponse"], $this->config['reCaptcha']['privateKey']);
            if (!$captchaOk) {
                $this->throwJsonError(403, _('Invalid CAPTCHA response. Please try again.'));
            }
        }

        $countryCode = GeoIP::getCountryCode($_SERVER['REMOTE_ADDR']);

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
            $message = mb_substr($message, 0, $this->config['view']['messageMaxLength']);
        }

        // Only most basic text formatting for non-golds.
        if ($this->user->goldLevel == 0) {
            $message = BbCode::removeDisallowed($message);
        }

        // Check blacklist
        $wordBlacklist = new WordBlacklist($this->db);
        $blacklistReason = $wordBlacklist->match($message);
        if ($blacklistReason !== false) {
            $this->throwJsonError(403, sprintf(_('Your message contained a blacklisted word: %s'), $blacklistReason));
        }

        $subject = null;
        if (!$isReply && isset($_POST['subject'])) {
            $subject = trim(mb_substr($_POST['subject'], 0, $this->config['view']['subjectMaxLength']));
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

            $post = $posts->createThread($this->user->id, $board->id, $subject, $message, $username, $countryCode);

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
            $followed = new UserThreadFollow($this->db);
            $followed->incrementUnreadCount($thread->id, $this->user->id);

            // Enable flood limit
            Cache::add('SpamLimit-reply-' . $_SERVER['REMOTE_ADDR'], 1, $this->config['posts']['replyIntervalLimit']);

            if (!$sage) {
                $thread->bump();
            }

            if ($thread->userId != $this->user->id) {
                // Notify OP
                $messageQueue->send([
                    UserNotification::NOTIFICATION_TYPE_THREAD_REPLY,
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
                UserNotification::NOTIFICATION_TYPE_POST_REPLY,
                $postReplies,
                $notificationsSkipUsers
            ], MessageQueue::MSG_TYPE_ADD_POST_NOTIFICATION);
        }

        if (!$isReply) {
            $this->jsonMessage($post->id);
        }
    }

    public function delete()
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

    public function deleteFile()
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
}
