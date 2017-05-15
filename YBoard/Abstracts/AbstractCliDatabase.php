<?php
namespace YBoard\Abstracts;

use YFW\Library\Database;

abstract class AbstractCliDatabase
{
    protected $config;
    protected $db;

    public function __construct(array $config = null, Database $db = null)
    {
        // Load config
        if ($config === null) {
            $this->config = require(ROOT_PATH . '/YBoard/Config/App.php');
        }

        // Get a database connection
        if ($db === null) {
            $this->db = new Database(require(ROOT_PATH . '/YBoard/Config/Database.php'));
        } else {
            $this->db = $db;
        }
    }
}
