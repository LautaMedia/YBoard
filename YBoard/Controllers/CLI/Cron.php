<?php
namespace YBoard\Controllers\CLI;

use YBoard\Abstracts\AbstractCliDatabase;

class CronDailyController extends AbstractCliDatabase
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
