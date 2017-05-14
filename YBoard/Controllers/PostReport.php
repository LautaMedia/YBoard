<?php
namespace YBoard\Controllers;

use YBoard\BaseController;
use YBoard\Models\Ban;
use YBoard\Models\LogModel;
use YBoard\Models\PostReport;
use YBoard\Models\Post;

class PostReport extends BaseController
{
    public function uncheckedReports()
    {
        $this->modOnly();

        $postReports = new PostReport($this->db);
        $view = $this->loadTemplateEngine();
        $view->pageTitle = _('Reports');

        $view->reports = $postReports->getUnchecked();
        $view->display('Mod/Reports');
    }

    public function setChecked()
    {
        $this->modOnly();
        $this->validateAjaxCsrfToken();

        if (empty($_POST['post_id'])) {
            $this->throwJsonError(400);
        }

        $reports = new PostReport($this->db);
        $report = $reports->get($_POST['post_id']);
        if ($report === false) {
            $this->throwJsonError(404, _('Report does not exist'));
        }

        $log = new LogModel($this->db);
        $log->write(LogModel::ACTION_ID_MOD_REPORT_CHECKED, $this->user->id, $report->id);
        $report->setChecked($this->user->id);
    }

    public function getForm()
    {
        $view = $this->loadTemplateEngine('Blank');

        $view->reasons = Ban::getReasons();
        $view->display('Ajax/ReportForm');
    }

    public function submit()
    {
        $this->validateAjaxCsrfToken();

        if ($this->user->ban) {
            $this->throwJsonError(403, _('You are banned!'));
        }

        if (empty($_POST['post_id']) || empty($_POST['reason_id'])) {
            $this->throwJsonError(400);
        }

        $posts = new Post($this->db);
        if ($posts->get($_POST['post_id'], false) === false) {
            $this->throwJsonError(404, _('Post does not exist'));
        }

        $postReports = new PostReport($this->db);

        if ($postReports->isReported($_POST['post_id'])) {
            $this->throwJsonError(418, _('This message has already been reported and is waiting for a review'));
        }

        $additionalInfo = empty($_POST['report_additional_info']) ? null : mb_substr($_POST['report_additional_info'], 0, 120);
        $postReports->add($_POST['post_id'], $_POST['reason_id'], $additionalInfo);
    }
}
