<?php
namespace YBoard\Abstracts;

use YFW\Library\Database;
use YFW\Model;

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

    abstract protected function load();
}
