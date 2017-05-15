<?php
namespace YBoard\Models;

use YBoard\Abstracts\AbstractUserModel;
use YFW\Library\Database;

class UserThreadFollow extends AbstractUserModel
{
    public $unreadCount = 0;
    public $threadId;
    public $lastSeenReply;

    protected $threads = [];
    protected $userId;

    public static function add(Database $db, int $userId, int $threadId): bool
    {
        $q = $db->prepare("INSERT IGNORE INTO user_thread_follow (user_id, thread_id) VALUES (:user_id, :thread_id)");
        $q->bindValue(':user_id', $userId, Database::PARAM_INT);
        $q->bindValue(':thread_id', $threadId, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function exists(int $threadId): bool
    {
        return array_key_exists($threadId, $this->threads);
    }

    public function getAll()
    {
        return $this->threads;
    }

    public function get(int $threadId)
    {
        if (empty($this->threads[$threadId])) {
            return false;
        }

        return $this->threads[$threadId];
    }

    public function getThreadUnreadCount(int $threadId)
    {
        if (empty($this->threads[$threadId])) {
            return false;
        }

        return $this->threads[$threadId]->unreadCount;
    }

    public function getThreadLastSeenReply(int $threadId)
    {
        if (empty($this->threads[$threadId]) || empty($this->threads[$threadId]->lastSeenReply)) {
            return false;
        }

        return $this->threads[$threadId]->lastSeenReply;
    }

    public function markAllRead(): bool
    {
        $q = $this->db->prepare("UPDATE user_thread_follow SET unread_count = 0
            WHERE user_id = :user_id AND thread_id = :thread_id");
        $q->bindValue(':user_id', $this->userId, Database::PARAM_INT);
        $q->bindValue(':thread_id', $this->threadId, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    protected function load(): bool
    {
        $q = $this->db->prepare("SELECT thread_id, last_seen_reply, unread_count
            FROM user_thread_follow WHERE user_id = :user_id ORDER BY unread_count DESC");
        $q->bindValue(':user_id', $this->userId, Database::PARAM_INT);
        $q->execute();

        $this->threads = [];
        while ($data = $q->fetch()) {
            $thread = new self($this->db);
            $this->threads[$data->thread_id] = $thread;
        }

        if (!empty($this->threads)) {
            $q = $this->db->prepare("SELECT SUM(unread_count) AS unread_count FROM user_thread_follow
            WHERE user_id = :user_id LIMIT 1");
            $q->bindValue(':user_id', $this->userId, Database::PARAM_INT);
            $q->execute();

            $this->unreadCount = $q->fetch(Database::FETCH_COLUMN);
        }

        return true;
    }

    public function remove(): bool
    {
        $q = $this->db->prepare("DELETE FROM user_thread_follow
            WHERE user_id = :user_id AND thread_id = :thread_id");
        $q->bindValue(':user_id', $this->userId, Database::PARAM_INT);
        $q->bindValue(':thread_id', $this->threadId, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function setLastSeenReply(int $lastSeenId): bool
    {
        $q = $this->db->prepare("UPDATE user_thread_follow SET last_seen_reply = :last_seen_id
            WHERE user_id = :user_id AND thread_id = :thread_id LIMIT 1");
        $q->bindValue(':last_seen_id', $lastSeenId, Database::PARAM_INT);
        $q->bindValue(':user_id', $this->userId, Database::PARAM_INT);
        $q->bindValue(':thread_id', $this->threadId, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function resetUnreadCount(): bool
    {
        $q = $this->db->prepare("UPDATE user_thread_follow SET unread_count = 0
            WHERE user_id = :user_id AND thread_id = :thread_id");
        $q->bindValue(':user_id', $this->userId, Database::PARAM_INT);
        $q->bindValue(':thread_id', $this->threadId, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public static function getFollowers(Database $db, int $threadId): array
    {
        $q = $db->prepare("SELECT user_id FROM user_thread_follow WHERE thread_id = :thread_id");
        $q->bindValue(':thread_id', $threadId, Database::PARAM_INT);
        $q->execute();

        return $q->fetchAll(Database::FETCH_COLUMN);
    }

    public static function incrementUnreadCount(Database $db, int $threadId, int $userNot = 0): bool
    {
        $q = $db->prepare("UPDATE user_thread_follow SET unread_count = unread_count+1
            WHERE thread_id = :thread_id AND user_id != :user_id");
        $q->bindValue(':thread_id', $threadId, Database::PARAM_INT);
        $q->bindValue(':user_id', $userNot, Database::PARAM_INT);
        $q->execute();

        return true;
    }
}
