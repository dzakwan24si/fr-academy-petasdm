<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffResign extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'join_date' => 'date',
        'resign_date' => 'date',
    ];
}
