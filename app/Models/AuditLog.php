<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $guarded = [];
    public const UPDATED_AT = null;
    
    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }
}
