<?php

use Illuminate\Support\Facades\Schedule;
use Illuminate\Foundation\Console\AboutCommand;

AboutCommand::add('User API', fn () => [
    'Authentication' => 'Laravel Sanctum Bearer tokens',
    'Frontend' => 'Disabled',
]);

Schedule::command('app:generate-recurring-expenses')->daily();
