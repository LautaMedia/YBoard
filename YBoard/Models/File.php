<?php
namespace YBoard\Models;

use YFW\Library\Database;
use YFW\Model;

class File extends Model
{
    public $id;
    public $displayName;
    public $folder;
    public $name;
    public $extension;
    public $size;
    public $width = null;
    public $height = null;
    public $thumbWidth = null;
    public $thumbHeight = null;
    public $duration = null;
    public $hasThumbnail = true;
    public $hasSound = null;
    public $isGif = null;
    public $inProgress = false;

    public function __construct(Database $db, $data = [])
    {
        parent::__construct($db);

        foreach ($data as $key => $val) {
            switch ($key) {
                case 'file_id':
                    $this->id = (int)$val;
                    break;
                case 'file_folder':
                    $this->folder = $val;
                    break;
                case 'file_name':
                    $this->name = $val;
                    break;
                case 'file_extension':
                    $this->extension = $val;
                    break;
                case 'file_size':
                    $this->size = (int)$val;
                    break;
                case 'file_width':
                    $this->width = (int)$val;
                    break;
                case 'file_height':
                    $this->height = (int)$val;
                    break;
                case 'file_display_name':
                    $this->displayName = $val;
                    break;
                case 'file_duration':
                    $this->duration = (int)$val;
                    break;
                case 'file_has_thumbnail':
                    $this->hasThumbnail = (bool)$val;
                    break;
                case 'file_has_sound':
                    $this->hasSound = (bool)$val;
                    break;
                case 'file_is_gif':
                    $this->isGif = (bool)$val;
                    break;
                case 'file_in_progress':
                    $this->inProgress = (bool)$val;
                    break;
            }
        }
    }

    public function updateSize(int $fileSize): bool
    {
        $q = $this->db->prepare('UPDATE files SET size = :size WHERE id = :id LIMIT 1');
        $q->bindValue('size', $fileSize, Database::PARAM_INT);
        $q->bindValue('id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function updateInProgress(bool $inProgress): bool
    {
        $q = $this->db->prepare('UPDATE files SET in_progress = :in_progress WHERE id = :id LIMIT 1');
        $q->bindValue('in_progress', $inProgress, Database::PARAM_INT);
        $q->bindValue('id', $this->id, Database::PARAM_INT);
        $q->execute();

        return true;
    }

    public function saveMd5List(array $md5List): bool
    {
        $values = '';
        foreach ($md5List as &$md5) {
            $values .= '(' . (int)$this->id . ', ?),';
            $md5 = hex2bin($md5);
        }
        $values = substr($values, 0, -1);

        $q = $this->db->prepare("INSERT IGNORE INTO files_md5 (file_id, md5) VALUES " . $values);
        $q->execute($md5List);

        return $q !== false;
    }
    public $savePath = false;
    public $maxPixelCount = 50000000;
    public $imgMaxWidth = 1920;
    public $imgMaxHeight = 1920;
    public $thumbMaxWidth = 240;
    public $thumbMaxHeight = 240;

    protected $selectQuery = 'id AS file_id, folder AS file_folder, name AS file_name,
        extension AS file_extension, size AS file_size, width AS file_width, height AS file_height,
        duration AS file_duration, in_progress AS file_in_progress, has_sound AS file_has_sound,
        is_gif AS file_is_gif';

    public function setConfig(array $config) : bool
    {
        $keys = [
            'savePath',
            'maxPixelCount',
            'imgMaxWidth',
            'imgMaxHeight',
            'thumbMaxWidth',
            'thumbMaxHeight',
        ];

        foreach ($keys as $key) {
            if (isset($config[$key])) {
                $this->$key = $config[$key];
            }
        }

        return true;
    }

    public function get(int $fileId)
    {
        $q = $this->db->prepare('SELECT ' . $this->selectQuery . ' FROM files WHERE id = :file_id LIMIT 1');
        $q->bindValue('file_id', $fileId, Database::PARAM_INT);
        $q->execute();

        if ($q->rowCount() == 0) {
            return false;
        }

        return new File($this->db, $q->fetch());
    }

    public function getByOrigName(string $fileName)
    {
        $q = $this->db->prepare('SELECT ' . $this->selectQuery . ' FROM posts_files a
            LEFT JOIN files b ON a.file_id = b.id
            WHERE file_name = :file_name LIMIT 1');
        $q->bindValue('file_name', $fileName);
        $q->execute();

        if ($q->rowCount() == 0) {
            return false;
        }

        return new File($this->db, $q->fetch());
    }

    public function getByName(string $fileName)
    {
        $q = $this->db->prepare('SELECT ' . $this->selectQuery . ' FROM files WHERE name = :name LIMIT 1');
        $q->bindValue('name', $fileName);
        $q->execute();

        if ($q->rowCount() == 0) {
            return false;
        }

        return new File($this->db, $q->fetch());
    }

    public function processUpload(array $file, bool $skipMd5Check = false) : UploadedFile
    {
        // Verify config
        if (!$this->savePath) {
            throw new InternalException(_('File save path not set'));
        }

        $sendMessage = false;
        $uploadedFile = new UploadedFile($this->db);

        // Rename uploaded file
        if (!move_uploaded_file($file['tmp_name'], $uploadedFile->tmpName)) {
            throw new FileUploadException(_('Cannot move uploaded file'));
        }

        $md5 = md5(file_get_contents($uploadedFile->tmpName));
        $uploadedFile->displayName = pathinfo($file['name'], PATHINFO_FILENAME);
        $uploadedFile->extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (empty($uploadedFile->extension)) {
            throw new FileUploadException(_('The file you uploaded is missing a file extension (e.g. ".jpg")'));
        }

        // If the file already exists, use the old one
        if (!$skipMd5Check) {
            $oldFile = $this->getByMd5($md5);
            if ($oldFile !== false) {
                $uploadedFile->id = $oldFile->id;

                return $uploadedFile;
            }
        }

        $uploadedFile->md5[] = $md5;

        $uploadedFile->folder = Text::randomStr(2, false);
        $uploadedFile->name = Text::randomStr(8, false);
        $uploadedFile->size = filesize($uploadedFile->tmpName);

        // Figure out in which format to save the file
        switch ($uploadedFile->extension) {
            case 'gif':
                $frames = FileHandler::getGifFrameCount($uploadedFile->tmpName);
                if ($frames === 0) {
                    throw new InternalException(_('Cannot get the number of GIF frames'));
                } elseif ($frames > 4000) {
                    throw new FileUploadException(_('The GIF you uploaded is too long, please upload a video file instead'));
                }

                if ($frames == 1) {
                    $uploadedFile->destinationFormat = 'jpg';
                } else {
                    $videoMeta = FileHandler::getVideoMeta($uploadedFile->tmpName);
                    if ($videoMeta === false) {
                        throw new FileUploadException(_('Invalid or corrupted media'));
                    }

                    $uploadedFile->destinationFormat = 'mp4';
                    $uploadedFile->isGif = true;
                }
                break;
            case 'jpeg':
            case 'jpg':
                $uploadedFile->destinationFormat = 'jpg';
                break;
            case 'png':
                $uploadedFile->destinationFormat = 'png';
                break;
            case 'mp3':
            case 'm4a':
            case 'aac':
            case 'mp4':
            case 'webm':
                $videoMeta = FileHandler::getVideoMeta($uploadedFile->tmpName);
                if ($videoMeta === false) {
                    throw new FileUploadException(_('Invalid or corrupted media'));
                }

                if ($videoMeta->duration > 300) {
                    throw new FileUploadException(_('The media you uploaded is too long'));
                }

                $uploadedFile->duration = $videoMeta->duration;
                $uploadedFile->hasSound = $videoMeta->hasSound;

                if (!$videoMeta->audioOnly) {
                    $uploadedFile->width = $videoMeta->width;
                    $uploadedFile->height = $videoMeta->height;
                    $uploadedFile->destinationFormat = 'mp4';
                } else {
                    $uploadedFile->destinationFormat = 'm4a';
                }
                break;
            default:
                $uploadedFile->destinationFormat = $uploadedFile->extension;
                break;
        }

        // Set file destination names
        $uploadedFile->thumbDestination = $this->savePath . '/' . $uploadedFile->folder . '/t/' . $uploadedFile->name . '.jpg';
        $uploadedFile->destination = $this->savePath . '/' . $uploadedFile->folder . '/o/' . $uploadedFile->name . '.' . $uploadedFile->destinationFormat;

        // Create directories if needed
        if (!is_dir($this->savePath . '/' . $uploadedFile->folder . '/t')) {
            if (!mkdir($this->savePath . '/' . $uploadedFile->folder . '/t', 0775, true)) {
                throw new InternalException(_('Creating a file directory failed'));
            }
        }
        if (!is_dir($this->savePath . '/' . $uploadedFile->folder . '/o')) {
            if (!mkdir($this->savePath . '/' . $uploadedFile->folder . '/o', 0775, true)) {
                throw new InternalException(_('Creating a file directory failed'));
            }
        }

        // Do whatever we do with the uploaded files here.
        switch ($uploadedFile->destinationFormat) {
            case 'jpg':
            case 'png':
                $this->limitPixelCount($uploadedFile->tmpName);

                FileHandler::createImage($uploadedFile->tmpName, $uploadedFile->destination, $this->imgMaxWidth,
                    $this->imgMaxHeight, $uploadedFile->destinationFormat);
                FileHandler::createThumbnail($uploadedFile->destination, $uploadedFile->thumbDestination,
                    $this->thumbMaxWidth, $this->thumbMaxHeight, 'jpg');

                if ($uploadedFile->destinationFormat == 'png') {
                    $sendMessage = MessageQueue::MSG_TYPE_DO_PNGCRUSH;
                }

                if (!FileHandler::verifyFile($uploadedFile->destination) || !FileHandler::verifyFile($uploadedFile->thumbDestination)) {
                    $uploadedFile->destroy();
                    throw new InternalException(_('Saving the uploaded file failed'));
                }

                $uploadedFile->md5[] = md5(file_get_contents($uploadedFile->destination));
                $uploadedFile->md5[] = md5(file_get_contents($uploadedFile->thumbDestination));

                // Get size of the final images
                list($uploadedFile->width, $uploadedFile->height) = getimagesize($uploadedFile->destination);

                break;
            case 'm4a':
                $uploadedFile->inProgress = true;
                $uploadedFile->hasThumbnail = false;

                rename($uploadedFile->tmpName, $uploadedFile->destination);

                $sendMessage = MessageQueue::MSG_TYPE_PROCESS_AUDIO;

                break;
            case 'mp4':
                $uploadedFile->inProgress = true;
                if ($uploadedFile->isGif === null) {
                    $uploadedFile->isGif = false;
                }

                rename($uploadedFile->tmpName, $uploadedFile->destination);
                FileHandler::createThumbnail($uploadedFile->destination, $uploadedFile->thumbDestination,
                    $this->thumbMaxWidth, $this->thumbMaxHeight, 'jpg');

                $sendMessage = MessageQueue::MSG_TYPE_PROCESS_VIDEO;

                break;
            default:
                throw new FileUploadException(sprintf(_('Unsupported file type: %s'), $uploadedFile->extension));
        }

        // Save file to database
        $q = $this->db->prepare("INSERT INTO files (folder, name, extension, size, width, height, duration,
            has_thumbnail, has_sound, is_gif, in_progress)
            VALUES (:folder, :name, :extension, :size, :width, :height, :duration, :has_thumbnail, :has_sound,
            :is_gif, :in_progress)");
        $q->bindValue('folder', $uploadedFile->folder);
        $q->bindValue('name', $uploadedFile->name);
        $q->bindValue('extension', $uploadedFile->destinationFormat);
        $q->bindValue('size', $uploadedFile->size, Database::PARAM_INT);
        $q->bindValue('width', $uploadedFile->width, Database::PARAM_INT);
        $q->bindValue('height', $uploadedFile->height, Database::PARAM_INT);
        $q->bindValue('duration', $uploadedFile->duration, Database::PARAM_INT);
        $q->bindValue('has_thumbnail', $uploadedFile->hasThumbnail, Database::PARAM_INT);
        $q->bindValue('has_sound', $uploadedFile->hasSound, Database::PARAM_INT);
        $q->bindValue('is_gif', $uploadedFile->isGif, Database::PARAM_INT);
        $q->bindValue('in_progress', $uploadedFile->inProgress, Database::PARAM_INT);
        $q->execute();

        $uploadedFile->id = $this->db->lastInsertId();
        if (!$uploadedFile->id) {
            throw new FileUploadException(sprintf(_('File upload failed')));
        }

        if ($sendMessage) {
            $mq = new MessageQueue();
            $mq->send($uploadedFile->id, $sendMessage);
        }

        // Save MD5
        $uploadedFile->saveMd5List($uploadedFile->md5);

        return $uploadedFile;
    }

    public function getByMd5(string $md5)
    {
        $q = $this->db->prepare("SELECT file_id FROM files_md5 WHERE md5 = :md5 LIMIT 1");
        $q->bindValue('md5', hex2bin($md5));
        $q->execute();

        if ($q->rowCount() == 0) {
            return false;
        }

        $row = $q->fetch();
        $file = new File($this->db);
        $file->id = $row->file_id;

        return $file;
    }

    public function deleteOrphans() : bool
    {
        $this->db->query("DELETE FROM files WHERE id NOT IN (SELECT file_id FROM posts_files)");

        return true;
    }

    public function exists(string $name) : bool
    {
        $q = $this->db->prepare("SELECT id FROM files WHERE name = :name LIMIT 1");
        $q->bindValue('name', $name);
        $q->execute();

        return $q->rowCount() != 0;
    }

    protected function limitPixelCount(string $file)
    {
        if ($this->getPixelCount($file) > $this->maxPixelCount) {
            throw new FileUploadException(sprintf(_('Uploaded file exceeds the max pixel count of %s MP'),
                round($this->maxPixelCount / 1000000, 2)));
        }
    }

    protected function getPixelCount(string $file) : int
    {
        $sizes = getimagesize($file);

        if (!$sizes) {
            throw new FileUploadException(_('The file is not a valid image'));
        }

        return $sizes[0] * $sizes[1];
    }
}
