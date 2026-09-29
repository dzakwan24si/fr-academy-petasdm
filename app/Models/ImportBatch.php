<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImportBatch extends Model
{
    protected $guarded = [];
    
    protected function casts(): array
    {
        return [
            'warnings' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    protected function asJson($value, $flags = 0)
    {
        return json_encode($value, JSON_INVALID_UTF8_SUBSTITUTE | $flags);
    }
}
