<?php
namespace YBoard\Controller\Cli;

use YBoard\CliController;
use YBoard\Model\File;
use YBoard\Model\Post;
use YFW\Library\Database;
use YFW\Library\FileHandler;

class FixThings extends CliController
{
    public function fileSizes(): void
    {
        $glob = glob($this->config['file']['savePath'] . '/[a-z0-9][a-z0-9]/o/*.*', GLOB_BRACE);
        foreach ($glob AS $filePath) {
            $fileName = pathinfo($filePath, PATHINFO_FILENAME);

            $file = File::getByName($this->db, $fileName);
            if (!$file) {
                continue;
            }

            $file->setSize(filesize($filePath));

            echo $filePath . " updated\n";
        }
    }

    public function fileDimensions(): void
    {
        $glob = glob($this->config['file']['savePath'] . '/[a-z0-9][a-z0-9]/o/*.*', GLOB_BRACE);
        foreach ($glob AS $filePath) {
            $fileName = pathinfo($filePath, PATHINFO_FILENAME);

            $file = File::getByName($this->db, $fileName);
            if (!$file) {
                continue;
            }

            $width = $height = $thumbWidth = $thumbHeight = null;
            $origPath = $this->config['file']['savePath'] . '/' . $file->folder . '/o/' . $file->name . '.' . $file->extension;

            if ($file->extension === 'mp4') {

                $videoMeta = FileHandler::getVideoMeta($origPath);
                if ($videoMeta === null) {
                    echo $filePath . " MAYBE CORRUPTED!\n";
                }

                if (!$videoMeta->audioOnly) {
                    $width = $videoMeta->width;
                    $height = $videoMeta->height;
                }
            } elseif (in_array($file->extension, ['png', 'jpg'])) {
                [$width, $height] = getimagesize($origPath);
            } else {
                echo $filePath . " skipped\n";

                continue;
            }

            if ($file->hasThumbnail) {
                $thumbPath = $this->config['file']['savePath'] . '/' . $file->folder . '/t/' . $file->name . '.jpg';
                [$thumbWidth, $thumbHeight] = getimagesize($thumbPath);
            }

            $file->setDimensions($width, $height, $thumbWidth, $thumbHeight);

            echo $filePath . " updated\n";
        }
    }

    public function refLinks(): void
    {
        $q = $this->db->query('SELECT * FROM post_reply');

        while ($reply = $q->fetch()) {
            $repliedPost = Post::get($this->db, $reply->post_id_replied);
            if ($repliedPost === null) {
                echo 'INVALID REPLY ' . $reply->post_id . ' --> ' . $reply->post_id_replied . "\n";
            }

            $userId = $repliedPost->userId;

            if ($userId === $reply->user_id) {
                continue;
            }

            $update = $this->db->prepare('UPDATE post_reply SET is_op = :is_op, user_id = :user_id
                WHERE post_id = :post_id AND post_id_replied = :post_id_replied LIMIT 1');
            $update->bindValue(':user_id', $userId, Database::PARAM_INT);
            $update->bindValue(':post_id', $reply->post_id, Database::PARAM_INT);
            $update->bindValue(':post_id_replied', $reply->post_id_replied, Database::PARAM_INT);
            $update->execute();

            echo $reply->post_id . ' --> ' . $reply->post_id_replied . " updated\n";
        }
    }
}
