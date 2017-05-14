<?php
namespace YBoard\Models;

use YFW\Library\Database;
use YFW\Model;

class FollowedThread extends Model
{
    public $id;
    public $threadId;
    public $lastSeenReply;
    public $unreadCount = 0;

    protected $userId;

    public function remove() : bool
    {
        $q = $this->db->prepare("DELETE FROM user_thread_follow WHERE id = :id");
        $q->bindValue('id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function setLastSeenReply(int $lastSeenId) : bool
    {
        $q = $this->db->prepare("UPDATE user_thread_follow SET last_seen_reply = :last_seen_id
            WHERE id = :id LIMIT 1");
        $q->bindValue('last_seen_id', $lastSeenId, Database::PARAM_INT);
        $q->bindValue('id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function resetUnreadCount() : bool
    {
        $q = $this->db->prepare("UPDATE user_thread_follow SET unread_count = 0
            WHERE id = :id");
        $q->bindValue('id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

}
