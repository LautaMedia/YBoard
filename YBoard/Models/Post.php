<?php
namespace YBoard\Models;

use YFW\Library\Database;
use YFW\Model;

class Post extends Model
{
    public $id;
    public $userId;
    public $ip;
    public $countryCode;
    public $boardId;
    public $threadId;
    public $time;
    public $username;
    public $message;
    public $postReplies;
    public $file;

    public function __construct(Database $db, \stdClass $data = null)
    {
        parent::__construct($db);

        if ($data !== null) {
            foreach ($data as $key => $val) {
                switch ($key) {
                    case 'id':
                        $this->id = (int)$val;
                        break;
                    case 'user_id':
                        $this->userId = $val;
                        break;
                    case 'ip':
                        $this->ip = inet_ntop($val);
                        break;
                    case 'country_code':
                        $this->countryCode = $val;
                        break;
                    case 'board_id':
                        $this->boardId = (int)$val;
                        break;
                    case 'thread_id':
                        $this->threadId = (int)$val;
                        break;
                    case 'time':
                        $this->time = $val;
                        break;
                    case 'username':
                        $this->username = $val;
                        break;
                    case 'message':
                        $this->message = $val;
                        break;
                    case 'post_replies':
                        $this->postReplies = empty($val) ? null : explode(',', $val);
                        break;
                }
            }
        }

        if (!empty($data->file_id)) {
            $this->file = new File($this->db, $data);
        }
    }

    public function delete(): bool
    {
        $q = $this->db->prepare("INSERT IGNORE INTO post_deleted (id, user_id, board_id, thread_id, ip, time, subject, message, time_deleted)
            SELECT id, user_id, board_id, thread_id, ip, time, subject, message, NOW() FROM post
            WHERE id = :post_id OR thread_id = :post_id_2");
        $q->bindValue('post_id', $this->id, Database::PARAM_INT);
        $q->bindValue('post_id_2', $this->id, Database::PARAM_INT);
        $q->execute();

        $q = $this->db->prepare("DELETE FROM post WHERE id = :post_id LIMIT 1");
        $q->bindValue('post_id', $this->id, Database::PARAM_INT);
        $q->execute();

        return $q->rowCount() !== 0;
    }

    public function getRepliedPosts(): array
    {
        $q = $this->db->prepare("SELECT post_id_replied FROM post_reply WHERE post_id = :post_id");
        $q->bindValue('post_id', $this->id, Database::PARAM_INT);
        $q->execute();

        return $q->fetchAll(Database::FETCH_COLUMN);
    }

    public function removeFiles(): bool
    {
        $q = $this->db->prepare("DELETE FROM post_file WHERE post_id = :post_id");
        $q->bindValue('post_id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function addFile(int $fileId, string $fileName): bool
    {
        $q = $this->db->prepare("INSERT INTO post_file (post_id, file_id, file_name)
            VALUES (:post_id, :file_id, :file_name)");
        $q->bindValue('post_id', $this->id, Database::PARAM_INT);
        $q->bindValue('file_id', $fileId, Database::PARAM_INT);
        $q->bindValue('file_name', $fileName);
        $q->execute();

        return true;
    }

    public function setReplies(array $replies, bool $clearOld = false): bool
    {
        if (count($replies) == 0) {
            return true;
        }

        $query = str_repeat('(?,?),', count($replies));
        $query = substr($query, 0, -1);

        $queryVars = [];
        foreach ($replies as $repliedId) {
            $queryVars[] = $this->id;
            $queryVars[] = $repliedId;
        }

        if ($clearOld) {
            $q = $this->db->prepare("DELETE FROM post_reply WHERE post_id = :post_id");
            $q->bindValue('post_id', $this->id, Database::PARAM_INT);
            $q->execute();
        }

        $q = $this->db->prepare("INSERT IGNORE INTO post_reply (post_id, post_id_replied) VALUES " . $query);
        $q->execute($queryVars);

        return true;
    }

    public static function get(Database $db, int $postId, bool $allData = true)
    {
        $wasArray = true;
        if (!is_array($postId)) {
            $wasArray = false;
            $postId = [$postId];
        }

        $in = $db->buildIn($postId);
        if ($allData) {
            $q = $db->prepare(static::getPostsQuery('WHERE a.id IN (' . $in . ')'));
        } else {
            $q = $db->prepare("SELECT id, board_id, thread_id, user_id, ip, country_code, time, username
            FROM posts WHERE id IN (" . $in . ")");
        }
        $q->execute($postId);

        if ($q->rowCount() == 0) {
            return false;
        }

        if (!$wasArray) {
            return new self($db, $q->fetch());
        }

        $posts = [];
        while ($row = $q->fetch()) {
            $posts[] = new self($db, $row);
        }

        return $posts;
    }

    public static function getDeleted(Database $db, int $postId)
    {
        $q = $db->prepare("SELECT * FROM post_deleted WHERE id = :id LIMIT 1");
        $q->bindValue('id', $postId, Database::PARAM_INT);
        $q->execute();

        if ($q->rowCount() == 0) {
            return false;
        }

        return new self($db, $q->fetch());
    }

    public static function deleteMany(Database $db, array $postIds): bool
    {
        $in = $db->buildIn($postIds);

        $q = $db->prepare("INSERT IGNORE INTO post_deleted (id, user_id, board_id, thread_id, ip, time, subject, message, time_deleted)
            SELECT id, user_id, board_id, thread_id, ip, time, subject, message, NOW() FROM post
            WHERE id IN (" . $in . ") OR thread_id IN (" . $in . ")");
        $q->execute(array_merge($postIds, $postIds));

        $q = $db->prepare("DELETE FROM post WHERE id IN (" . $in . ")");
        $q->execute($postIds);

        return $q->rowCount() != 0;
    }

    public static function deleteByUser(Database $db, int $userId, int $intervalHours = 1000000): bool
    {
        $q = $db->prepare("INSERT INTO post_deleted (id, user_id, board_id, thread_id, ip, time, subject, message, time_deleted)
            SELECT id, user_id, board_id, thread_id, ip, time, subject, message, NOW() FROM post
            WHERE user_id = :user_id AND time >= DATE_SUB(NOW(), INTERVAL :interval_hours HOUR)");
        $q->bindValue('user_id', $userId, Database::PARAM_INT);
        $q->bindValue('interval_hours', $intervalHours, Database::PARAM_INT);
        $q->execute();

        $q = $db->prepare("DELETE FROM post
            WHERE user_id = :user_id AND time >= DATE_SUB(NOW(), INTERVAL :interval_hours HOUR)");
        $q->bindValue('user_id', $userId, Database::PARAM_INT);
        $q->bindValue('interval_hours', $intervalHours, Database::PARAM_INT);
        $q->execute();

        return true;
    }
}
