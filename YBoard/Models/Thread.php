<?php
namespace YBoard\Models;

use YFW\Library\Database;
use YFW\Library\Text;

class Thread extends Post
{
    public $boardUrl;
    public $subject;
    public $locked = false;
    public $sticky = false;
    public $replies = false;
    public $replyCount = 0;
    public $distinctReplyCount = 0;
    public $readCount = 0;

    protected static $hiddenIds = [];

    public function __construct(Database $db, \stdClass $data = null, int $maxReplies)
    {
        parent::__construct($db, $data);

        if ($data !== null) {
            foreach ($data as $key => $val) {
                switch ($key) {
                    case 'board_url':
                        $this->boardUrl = $val;
                        break;
                    case 'locked':
                        $this->locked = (bool)$val;
                        break;
                    case 'sticky':
                        $this->sticky = (bool)$val;
                        break;
                    case 'subject':
                        $this->subject = $val;
                        break;
                    case 'read_count':
                        $this->readCount = (int)$val;
                        break;
                    case 'reply_count':
                        $this->replyCount = (int)$val;
                        break;
                    case 'distinct_reply_count':
                        $this->distinctReplyCount = (int)$val;
                        break;
                }
            }
        }

        if (empty($this->subject) && $this->subject != '0' && !empty($this->message)) {
            $this->subject = $this->createSubject($this->message);
        }

        if (!$maxReplies) {
            $this->replies = false;
        } elseif ($maxReplies >= 10000) {
            $this->replies = $this->getReplies();
        } else {
            $this->replies = $this->getReplies($maxReplies, true);
        }
    }

    public function bump(): bool
    {
        $q = $this->db->prepare("UPDATE post SET bump_time = NOW() WHERE id = :thread_id LIMIT 1");
        $q->bindValue('thread_id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function undoLastBump(): bool
    {
        $q = $this->db->prepare("UPDATE post a LEFT JOIN post b ON a.id = b.thread_id
            SET a.bump_time = IFNULL(b.time, a.time) WHERE a.id = :thread_id");
        $q->bindValue('thread_id', (int)$this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function setLocked(bool $locked): bool
    {
        $q = $this->db->prepare("UPDATE post SET locked = :locked WHERE id = :thread_id LIMIT 1");
        $q->bindValue('thread_id', $this->id, Database::PARAM_INT);
        $q->bindValue('locked', $locked, Database::PARAM_INT);
        $q->execute();

        $this->locked = $locked;

        return true;
    }

    public function setSticky(bool $sticky): bool
    {
        $q = $this->db->prepare("UPDATE post SET sticky = :sticky WHERE id = :thread_id LIMIT 1");
        $q->bindValue('thread_id', $this->id, Database::PARAM_INT);
        $q->bindValue('sticky', $sticky, Database::PARAM_INT);
        $q->execute();

        $this->sticky = $sticky;

        return true;
    }

    public function addReply(
        int $userId,
        string $message,
        $username,
        string $countryCode
    ): Reply {
        $q = $this->db->prepare("INSERT INTO post
            (user_id, thread_id, ip, country_code, username, message)
            VALUES (:user_id, :thread_id, :ip, :country_code, :username, :message)
        ");
        $q->bindValue('user_id', $userId, Database::PARAM_INT);
        $q->bindValue('thread_id', $this->id, Database::PARAM_INT);
        $q->bindValue('ip', inet_pton($_SERVER['REMOTE_ADDR']));
        $q->bindValue('country_code', $countryCode);
        $q->bindValue('username', $username);
        $q->bindValue('message', $message);
        $q->execute();

        $reply = new Reply($this->db);
        $reply->id = $this->db->lastInsertId();

        return $reply;
    }

    public function getReplies(int $count = null, bool $newest = false, int $fromId = null): array
    {
        $from = '';
        if ($newest) {
            $order = 'DESC';
            if ($fromId) {
                $from = ' AND a.id > :from';
            }
        } else {
            $order = 'ASC';
            if ($fromId) {
                $from = ' AND a.id < :from';
            }
        }

        if ($count) {
            $limit = ' LIMIT ' . (int)$count;
        } else {
            $limit = '';
        }

        $q = $this->db->prepare($this->getPostQuery('WHERE a.thread_id = :thread_id' . $from . ' ORDER BY a.id ' . $order . $limit));
        $q->bindValue('thread_id', $this->id, Database::PARAM_INT);
        if ($from) {
            $q->bindValue('from', $fromId, Database::PARAM_INT);
        }
        $q->execute();

        $replies = [];
        while ($row = $q->fetch()) {
            $row->thread_id = $this->id;
            $replies[] = new Reply($this->db, $row);
        }

        if ($newest) {
            $replies = array_reverse($replies);
        }

        return $replies;
    }

    public function updateStats(string $key, int $val = 1): bool
    {
        switch ($key) {
            case "replyCount":
                $column = 'reply_count';
                break;
            case "readCount":
                $column = 'read_count';
                break;
            case "followCount":
                $column = 'follow_count';
                break;
            case "hideCount":
                $column = 'hide_count';
                break;
            default:
                return false;
        }

        $q = $this->db->prepare("INSERT INTO thread_statistics (thread_id, " . $column . ") VALUES (:thread_id, :val)
            ON DUPLICATE KEY UPDATE " . $column . " =  " . $column . "+:val_2");

        $q->bindValue('thread_id', $this->id, Database::PARAM_INT);
        $q->bindValue('val', $val, Database::PARAM_INT);
        $q->bindValue('val_2', $val, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    protected static function createSubject(string $message): string
    {
        $subject = Text::stripFormatting($message);
        $subject = Text::truncate($subject, 40);
        $subject = trim($subject);

        return $subject;
    }

    public static function setHidden(array $hiddenIds)
    {
        static::$hiddenIds = $hiddenIds;
    }

    public static function get(Database $db, int $threadId, bool $allData = true)
    {
        if ($allData) {
            $q = $db->prepare(static::getPostQuery("WHERE a.id = :id AND a.thread_id IS NULL LIMIT 1"));
        } else {
            $q = $db->prepare("SELECT id, board_id, user_id, ip, country_code, time, locked, sticky
            FROM post WHERE id = :id AND thread_id IS NULL LIMIT 1");
        }
        $q->bindValue('id', $threadId, Database::PARAM_INT);
        $q->execute();

        if ($q->rowCount() == 0) {
            return false;
        }

        $row = $q->fetch();
        $thread = new self($db, $row, ($allData ? 10000 : false)); // >= 10000 to get all replies

        return $thread;
    }

    public static function getIdsByUser(Database $db, int $userId, int $limit = 1000): array
    {
        $q = $db->prepare("SELECT id FROM post
            WHERE user_id = ? AND thread_id IS NULL" . static::getHiddenNotIn('id') . " LIMIT ?");

        $queryVars = static::$hiddenIds;
        array_unshift($queryVars, $userId);
        array_push($queryVars, $limit);

        $q->execute($queryVars);

        if ($q->rowCount() == 0) {
            return [];
        }

        return $q->fetchAll(Database::FETCH_COLUMN);
    }

    public static function getOldIds(Database $db, int $boardId, int $hours, int $limit = 100): array
    {
        $q = $db->prepare("SELECT id FROM post
            WHERE board_id = :board_id AND thread_id IS NULL AND bump_time < DATE_SUB(NOW(), INTERVAL :hours HOUR)
            AND sticky = 0
            LIMIT :limit");
        $q->bindValue('board_id', $boardId, Database::PARAM_INT);
        $q->bindValue('hours', $hours, Database::PARAM_INT);
        $q->bindValue('limit', $limit, Database::PARAM_INT);
        $q->execute();

        if ($q->rowCount() == 0) {
            return [];
        }

        return $q->fetchAll(Database::FETCH_COLUMN);
    }

    public static function getIdsRepliedByUser(Database $db, int $userId, int $limit = 1000): array
    {
        $q = $db->prepare("SELECT DISTINCT thread_id AS thread_id FROM post
            WHERE user_id = ? AND thread_id IS NOT NULL" . static::getHiddenNotIn('thread_id') . " LIMIT ?");

        $queryVars = static::$hiddenIds;
        array_unshift($queryVars, $userId);
        array_push($queryVars, $limit);

        $q->execute($queryVars);

        if ($q->rowCount() == 0) {
            return [];
        }

        return $q->fetchAll(Database::FETCH_COLUMN);
    }

    public static function getCustom(
        Database $db,
        array $threadIds,
        int $page,
        int $count,
        int $replyCount = 0,
        $keepOrder = false
    ): array {
        $limitStart = ($page - 1) * $count;

        if (count($threadIds) == 0) {
            return [];
        }

        $in = $db->buildIn($threadIds);

        $order = '';
        if ($keepOrder) {
            $order = ' FIELD(a.id, ' . $in . '),';
            $threadIds = array_merge($threadIds, $threadIds);
        }

        $q = $db->prepare(static::getPostQuery("WHERE a.id IN (" . $in . ")
            ORDER BY" . $order . " bump_time DESC LIMIT " . (int)$limitStart . ', ' . (int)$count));
        $q->execute($threadIds);

        if ($q->rowCount() == 0) {
            return [];
        }

        $threads = [];

        while ($row = $q->fetch()) {
            // Assign values to a class to return
            $thread = new self($db, $row, $replyCount);
            $threads[] = $thread;
        }

        return $threads;
    }

    public static function getByBoard(Database $db, int $boardId, int $page, int $count, int $replyCount = 0): array
    {
        $limitStart = ($page - 1) * $count;

        $q = $db->prepare(static::getPostQuery("WHERE a.board_id = ? AND a.thread_id IS NULL
            " . static::getHiddenNotIn('a.id') . "
            ORDER BY sticky DESC, bump_time DESC LIMIT " . (int)$limitStart . ', ' . (int)$count));

        $queryVars = static::$hiddenIds;
        array_unshift($queryVars, $boardId);

        $q->execute($queryVars);

        if ($q->rowCount() == 0) {
            return [];
        }

        $threads = [];

        while ($row = $q->fetch()) {
            // Assign values to a class to return
            $thread = new self($db, $row, $replyCount);
            $threads[] = $thread;
        }

        return $threads;
    }

    public static function createThread(
        Database $db,
        int $userId,
        int $boardId,
        string $subject,
        string $message,
        $username,
        string $countryCode
    ): Thread {
        $thread = new self($db, null, false);
        $thread->userId = $userId;
        $thread->boardId = $boardId;
        $thread->ip = $_SERVER['REMOTE_ADDR'];
        $thread->countryCode = $countryCode;
        $thread->username = $username;
        $thread->subject = empty($subject) ? null : $subject;
        $thread->message = $message;

        $q = $db->prepare("INSERT INTO post
            (user_id, board_id, ip, country_code, username, subject, message, bump_time, locked, sticky)
            VALUES (:user_id, :board_id, :ip, :country_code, :username, :subject, :message, NOW(), 0, 0)
        ");
        $q->bindValue('user_id', $thread->userId, Database::PARAM_INT);
        $q->bindValue('board_id', $thread->boardId, Database::PARAM_INT);
        $q->bindValue('ip', inet_pton($thread->ip));
        $q->bindValue('country_code', $thread->countryCode);
        $q->bindValue('username', $thread->username);
        $q->bindValue('subject', $thread->subject);
        $q->bindValue('message', $thread->message);
        $q->execute();

        $thread->id = $db->lastInsertId();

        return $thread;
    }

    protected static function getHiddenNotIn(string $column): string
    {
        $notIn = '';
        if (!empty(static::$hiddenIds)) {
            $notIn = ' AND ' . $column . ' NOT IN (';
            $notIn .= str_repeat('?,', count(static::$hiddenIds));
            $notIn = substr($notIn, 0, -1);
            $notIn .= ')';
        }

        return $notIn;
    }

    protected static function getPostQuery(string $append = '') : string
    {
        $query = "SELECT
            a.id, a.board_id, a.thread_id, user_id, ip, country_code, time, locked, sticky, username, subject, message,
            b.file_name AS file_display_name, c.id AS file_id, c.folder AS file_folder, c.name AS file_name,
            c.extension AS file_extension, c.size AS file_size, c.width AS file_width, c.height AS file_height,
            c.duration AS file_duration, c.has_thumbnail AS file_has_thumbnail, c.has_sound AS file_has_sound,
            c.is_gif AS file_is_gif, c.in_progress AS file_in_progress, d.read_count, d.reply_count,
            d.distinct_reply_count, e.url AS board_url,
            (SELECT GROUP_CONCAT(post_id) FROM post_reply WHERE post_id_replied = a.id) AS post_replies
            FROM post a
            LEFT JOIN post_file b ON a.id = b.post_id
            LEFT JOIN file c ON b.file_id = c.id
            LEFT JOIN post_statistics d ON a.id = d.thread_id
            LEFT JOIN board e ON e.id = a.board_id
            ";

        return $query . $append;
    }
}
