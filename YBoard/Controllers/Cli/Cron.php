<?php
namespace YBoard\Controllers\Cli;

use YBoard\Abstracts\AbstractCliDatabase;

class Cron extends AbstractCliDatabase
{
    public function daily()
    {
        $cleanup = new Cleanup($this->config, $this->db);
        $cleanup->deleteOldFiles();
    }

    public function hourly()
    {
        $cleanup = new Cleanup($this->config, $this->db);
        $cleanup->deleteOldPosts();
        $cleanup->deleteOldUsers();
    }
}
