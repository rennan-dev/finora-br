<?php

use Illuminate\Foundation\Console\AboutCommand;

AboutCommand::add('User API', fn () => [
    'Authentication' => 'Laravel Sanctum Bearer tokens',
    'Frontend' => 'Disabled',
]);
