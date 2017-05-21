<?php
namespace YBoard;

abstract class ApiController extends Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->validateAjaxCsrfToken();
    }
}
