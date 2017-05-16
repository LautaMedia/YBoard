<?php
namespace YBoard\Models\Traits;

use YBoard\Models\Ban;

trait BanReasons
{
    public $reasonId;

    public function getReasonText() : ?string
    {
        foreach (Ban::getReasons() as $reasonId => $reason) {
            if ($this->reasonId == $reasonId) {
                return $reason['name'];
            }
        }

        return null;
    }
}
