<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TrainingRecordFactory extends Factory
{
    public function definition(): array
    {
        return [
            'employee_id' => null,
            'company_id' => null,
            'nik' => $this->faker->numerify('########'),
            'nik_raw' => $this->faker->numerify('########'),
            'nik_status' => 'ok',
            'participant_name' => $this->faker->name(),
            'company_name_raw' => $this->faker->company(),
            'department' => $this->faker->word(),
            'work_location' => $this->faker->city(),
            'group' => $this->faker->word(),
            'region' => $this->faker->state(),
            'grade' => 'STAF',
            'position' => $this->faker->jobTitle(),
            'month' => $this->faker->month(),
            'year' => $this->faker->year(),
            'days' => $this->faker->numberBetween(1, 5),
            'hours' => $this->faker->randomFloat(2, 4, 40),
            'training_name' => $this->faker->sentence(3),
            'instructor' => $this->faker->name(),
            'venue' => $this->faker->city(),
            'regularity' => 'Reguler',
            'source_type' => 'Internal',
            'level' => 'Dasar',
        ];
    }
}
