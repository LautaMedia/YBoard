<?php
namespace YBoard\Controller\Cli;

use YBoard\CliController;
use YBoard\Model\File;
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
}
