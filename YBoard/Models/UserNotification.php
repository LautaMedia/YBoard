<?php
namespace YBoard\Models;

use YBoard\Controllers\Notification;
use YFW\Library\Database;
use YFW\Model;

class UserNotification extends Model
{
    const NOTIFICATION_TYPE_POST_REPLY = 1;
    const NOTIFICATION_TYPE_THREAD_REPLY = 2;
    //const NOTIFICATION_TYPE_FOLLOWED_REPLY = 3;
    const NOTIFICATION_TYPE_GOT_TAG = 4;
    const NOTIFICATION_TYPE_GOT_GOLD = 5;
    const NOTIFICATION_TYPE_THREAD_SUPERSAGED = 6;
    const NOTIFICATION_TYPE_THREAD_FORCEBUMPED = 7;
    const NOTIFICATION_TYPE_THREAD_REVIVED = 8;
    const NOTIFICATION_TYPE_THREAD_AUTOLOCKED = 9;

    protected $userId;
    protected $hiddenTypes;
    protected $list = [];

    public $unreadCount = 0;
    public $id;
    public $time;
    public $type;
    public $postId;
    public $customData;
    public $count;
    public $isRead;
    public $text;

    public function remove(): bool
    {
        $q = $this->db->prepare("DELETE FROM user_notification WHERE id = :id LIMIT 1");
        $q->bindValue(':id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function markRead(): bool
    {
        $q = $this->db->prepare("UPDATE user_notification SET count = 0, is_read = 1
            WHERE id = :id AND is_read = 0 LIMIT 1");
        $q->bindValue(':id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function __construct(Database $db, int $userId = null, array $hiddenTypes = [], bool $skipLoad = false)
    {
        parent::__construct($db);
        $this->userId = $userId;
        $this->hiddenTypes = $hiddenTypes;

        if ($this->userId !== null && !$skipLoad) {
            $this->load();
        }
    }

    public static function decrementCountByPostId(Database $db, int $postId, int $type = null): bool
    {
        if (!is_array($postId)) {
            $postId = [$postId];
        }

        $params = $postId;

        $whereType = '';
        if ($type !== null) {
            if (!is_array($type)) {
                $type = [$type];
            }

            $params = array_merge($postId, $type);
            $whereType = ' AND type IN (' . $db->buildIn($type) . ')';
        }

        $q = $db->prepare("UPDATE user_notification SET count = count-1
            WHERE post_id IN (" . $db->buildIn($postId) . ")" . $whereType);
        $q->execute($params);

        if ($q->rowCount() == 0) {
            return false;
        }

        return true;
    }

    public static function clearInvalid(Database $db): bool
    {
        $q = $db->prepare("DELETE FROM user_notification WHERE is_read = 0 AND count = 0");
        $q->execute();

        return true;
    }

    public static function add(Database $db, int $userId, int $type, string $customData = null, int $postId = null): bool
    {
        $q = $db->prepare("INSERT INTO user_notification (user_id, type, post_id, custom_data) 
            VALUES (:user_id, :type, :post_id, :custom_data)
            ON DUPLICATE KEY UPDATE is_read = 0, count = count+1");

        $q->bindValue(':user_id', $userId);
        $q->bindValue(':type', $type);
        $q->bindValue(':custom_data', $customData);
        $q->bindValue(':post_id', $postId);
        $q->execute();

        return true;
    }

    public function markReadByThread(int $threadId): bool
    {
        $q = $this->db->prepare("UPDATE user_notification SET is_read = 1, count = 0
            WHERE user_id = :user_id AND post_id IN (SELECT id FROM post WHERE thread_id = :thread_id) AND is_read = 0");
        $q->bindValue(':thread_id', $threadId);
        $q->bindValue(':user_id', $this->userId);
        $q->execute();

        return true;
    }

    public function markReadByPost(int $postId): bool
    {
        $q = $this->db->prepare("UPDATE user_notification SET count = 0, is_read = 1
            WHERE post_id = :post_id AND user_id = :user_id AND is_read = 0 LIMIT 1");
        $q->bindValue(':post_id', $postId);
        $q->bindValue(':user_id', $this->userId);
        $q->execute();

        return true;
    }

    public function markAllRead(): bool
    {
        $q = $this->db->prepare("UPDATE user_notification SET count = 0, is_read = 1
            WHERE user_id = :user_id AND is_read = 0");
        $q->bindValue(':user_id', $this->userId);
        $q->execute();

        return true;
    }

    public function get(int $id): ?self
    {
        if (empty($this->list[$id])) {
            return null;
        }

        $notification = $this->list[$id];
        $notification->text = $this->getText($notification);

        return $notification;
    }

    public function getAll(): array
    {
        foreach ($this->list as $notification) {
            $notification->text = $this->getText($notification);
        }

        return $this->list;
    }

    protected function getText(self $notification): string
    {
        switch ($notification->type) {
            case static::NOTIFICATION_TYPE_POST_REPLY:
                $text = _('Your message has') . ' ';
                if ($notification->count == 1) {
                    $text .= _('a new reply');
                } else {
                    $text .= _('%d new replies');
                }
                break;
            case static::NOTIFICATION_TYPE_THREAD_REPLY:
                $text = _('Your thread has') . ' ';
                if ($notification->count == 1) {
                    $text .= _('a new reply');
                } else {
                    $text .= _('%d new replies');
                }
                break;
            case static::NOTIFICATION_TYPE_GOT_TAG:
                $text = _('You just got a new tag: %s!');
                break;
            case static::NOTIFICATION_TYPE_GOT_GOLD:
                $text = _('Someone just gave you a gold account!');
                break;
            case static::NOTIFICATION_TYPE_THREAD_SUPERSAGED:
                $text = _('Someone supersaged your thread...');
                break;
            case static::NOTIFICATION_TYPE_THREAD_FORCEBUMPED:
                $text = _('Someone force bumped your thread');
                break;
            case static::NOTIFICATION_TYPE_THREAD_REVIVED:
                $text = _('Someone revived your thread');
                break;
            case static::NOTIFICATION_TYPE_THREAD_AUTOLOCKED:
                $text = _('Your thread reached the reply limit');
                break;
            default:
                $text = _('Lolwut? Unknown notification!');
                break;
        }

        return $text;
    }

    protected function load(): void
    {
        $params = [$this->userId];
        $notIn = '';
        if (!empty($this->hiddenTypes)) {
            $params = array_merge($params, $this->hiddenTypes);
            $notIn = ' AND type NOT IN (' . $this->db->buildIn($this->hiddenTypes) . ')';
        }

        $q = $this->db->prepare("SELECT id, time, type, post_id, custom_data, count, is_read FROM user_notification
            WHERE user_id = :user_id" . $notIn . " ORDER BY is_read ASC, time DESC LIMIT 100");
        $q->execute($params);

        while ($row = $q->fetch()) {
            $notification = new self($this->db);
            $notification->id = $row->id;
            $notification->time = $row->time;
            $notification->type = $row->type;
            $notification->postId = $row->post_id;
            $notification->customData = $row->custom_data;
            $notification->count = $row->count == 0 ? 1 : $row->count;
            $notification->isRead = (bool)$row->is_read;

            if (!$notification->isRead) {
                ++$this->unreadCount;
            }

            $this->list[$notification->id] = $notification;
        }
    }
}
