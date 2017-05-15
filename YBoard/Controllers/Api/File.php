<?php
namespace YBoard\Controllers\Api;

use YBoard\BaseController;
use YBoard\Models;
use YFW\Exceptions\FileUploadException;
use YFW\Library\TemplateEngine;

class File Extends BaseController
{
    public function delete()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['fileId'])) {
            $this->throwJsonError(400);
        }

        $file = Models\File::get($this->db, $_POST['fileId']);
        if ($file === false) {
            $this->throwJsonError(404, _('File does not exist'));
        }

        if ($file->userId != $this->user->id && !$this->user->isMod) {
            $this->throwJsonError(403, _('This isn\'t your file!'));
        }

        $thumbnail = $this->config['files']['savePath'] . '/' . $file->folder . '/t/' . $file->name . '.jpg';
        $full = $this->config['files']['savePath'] . '/' . $file->folder . '/o/' . $file->name . '.' . $file->extension;
        if (is_file($thumbnail)) {
            unlink($thumbnail);
        }
        if (is_file($full)) {
            unlink($full);
        }

        $file->delete();
    }

    public function upload()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_FILES['file'])) {
            $this->throwJsonError(400, _('No file uploaded'));
        }

        if (!is_dir($this->config['files']['savePath'])) {
            $this->throwJsonError(500, _('File uploads are temporarily disabled due to a configuration error'));
        }

        // Check that we have enough free space for files
        if (disk_free_space($this->config['files']['savePath']) <= $this->config['files']['diskMinFree']) {
            $this->throwJsonError(403, _('File uploads are temporarily disabled'));
        }

        // Process file
        $uploadedFile = new Models\UploadedFile($this->db);
        $uploadedFile->setConfig($this->config['files']);

        // Calculate file sizes
        $uploadSize = 0;
        foreach ($_FILES as $file) {
            $uploadSize += $file['size'];
        }

        if ($uploadSize >= $this->config['files']['maxSize']) {
            $this->throwJsonError(400, _('Your files exceed the maximum upload size'));
        }

        $ids = [];
        foreach ($_FILES as $file) {
            try {
                $uploadedFile->processUpload($file, $this->user->id, true);
            } catch (FileUploadException $e) {
                $this->throwJsonError(400, $e->getMessage());
            }

            $this->user->statistics->increment('uploadedFiles');
            $this->user->statistics->increment('uploadedFilesTotalSize', $file['size']);

            $ids[] = $uploadedFile->id;

            // Limit to one file per upload for now
            break;
        }

        $this->jsonMessage($ids);
    }

    public function getMediaPlayer()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['fileId'])) {
            $this->invalidAjaxData();
        }

        $files = new File($this->db);
        $file = $files->get($_POST['fileId']);

        if ($file === false) {
            $this->throwJsonError(404);
        }
        if ($file->inProgress) {
            $this->throwJsonError(418, _('This file is being processed...'));
        }

        $view = new TemplateEngine(ROOT_PATH . '/YBoard/View/', 'Blank');
        $view->fileUrl = $this->config['view']['staticUrl'] . '/files/' . $file->folder . '/o/' . $file->name . '/' . '1.' . $file->extension;
        $view->poster = $this->config['view']['staticUrl'] . '/files/' . $file->folder . '/t/' . $file->name . '.jpg';

        $view->loop = $file->isGif;

        $view->display('Ajax/MediaPlayer');
    }
}
