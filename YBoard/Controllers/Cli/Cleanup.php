<?php
namespace YBoard\Controllers\Cli;

use YBoard\Abstracts\AbstractCliDatabase;
use YBoard\Models\Board;
use YBoard\Models\File;
use YBoard\Models\Post;
use YBoard\Models\User;
use YBoard\Models\UserSession;

class Cleanup extends AbstractCliDatabase
{
    public function deleteOldFiles()
    {
        $files = new File($this->db);
        $files->deleteOrphans();

        $glob = glob(ROOT_PATH . '/public/static/files/*/*/*.*');
        $i = 1;
        $count = 0;
        foreach ($glob AS $file) {
            if ($i % 1000 == 0) {
                echo '.';
            }
            ++$i;

            $fileName = pathinfo($file, PATHINFO_FILENAME);
            if ($files->exists($fileName)) {
                continue;
            }

            unlink($file);
            if (!QUIET) {
                echo "\n" . $file . " deleted";
            }
            ++$count;
        }

        if (!QUIET) {
            echo "\n\n" . $count . " files deleted\n";
        }
    }

    public function deleteOldPosts()
    {
        $boards = new Board($this->db);
        $posts = new Post($this->db);

        $threads = [];
        foreach ($boards->getAll() as $board) {
            if (!$board->inactiveHoursDelete) {
                continue;
            }

            $threads = array_merge($threads, $posts->getOldThreads($board->id, $board->inactiveHoursDelete));
        }

        if (!empty($threads)) {
            $posts->deleteMany($threads);
        }

        if (!QUIET) {
            echo count($threads) . " threads deleted\n";
        }
    }

    public function deleteOldUsers()
    {
        $users = new User($this->db);
        $userSessions = new UserSession($this->db);

        // Expire old sessions
        $expiredSessions = $userSessions->getExpiredIds();
        if (!empty($expiredSessions)) {
            $userSessions->destroyMany($expiredSessions);
        }

        // Delete unusable user accounts
        $unusable = $users->getUnusable();
        if (!empty($unusable)) {
            $users->deleteMany($unusable);
        }

        if (!QUIET) {
            echo count($expiredSessions) . " expired sessions deleted\n";
            echo count($unusable) . " users deleted\n";
        }
    }
}
