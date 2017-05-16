<?php
namespace YBoard\Model;

use YBoard\Model;
use YFW\Library\Database;

abstract class AbstractUserModel extends Model
{
    protected $userId;

    public function __construct(Database $db, $userId = null, bool $skipLoad = false)
    {
        parent::__construct($db);
        $this->userId = $userId;

        if ($this->userId !== null && !$skipLoad) {
            $this->load();
        }
    }

    abstract protected function load(): void;
}
