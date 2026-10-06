<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $primaryKey = 'employee_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        if ($this->photo_path) {
            return asset('storage/'.$this->photo_path);
        }

        return null;
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}
