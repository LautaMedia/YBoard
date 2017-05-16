<?php
namespace YBoard\Controller\Cli;

class Cron extends AbstractCliDatabase
{
    public function daily(): void
    {
        $cleanup = new Cleanup($this->config, $this->db);
        $cleanup->deleteOldFiles();
    }

    public function hourly(): void
    {
        $cleanup = new Cleanup($this->config, $this->db);
        $cleanup->deleteOldPosts();
        $cleanup->deleteOldUsers();
    }
}
